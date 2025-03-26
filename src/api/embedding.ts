import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Request, Response, NextFunction } from "express";
import { Document } from "@langchain/core/documents";
import mongoose from "mongoose";
import Hotel from "../infrastructure/schemas/Hotel";

// Define an interface for the Hotel document
interface HotelDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  location: string;
  description: string;
  rooms: { price: number }[];
}

// Define the request body interface
interface EmbeddingRequestBody {
  budget?: number; 
  pricePreference?: "average" | "lowest" | "suggest";
}

export const createEmbeddings = async (
  req: Request<{}, {}, EmbeddingRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => { 
  try {
    // Extract budget and price preference from request body
    const { budget, pricePreference = "average" } = req.body || {};

    // Initialize OpenAI embeddings model
    const embeddingModel = new OpenAIEmbeddings({
      model: "text-embedding-ada-002",
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize MongoDB Atlas Vector Search
    const vectorIndex = new MongoDBAtlasVectorSearch(embeddingModel, {
      collection: mongoose.connection.collection("hotelVectors"),
      indexName: "vector_index",
    });

    // Fetch all hotels from the database
    const hotels = await Hotel.find({}) as HotelDocument[];

    if (!hotels.length) {
      res.status(200).json({ message: "No hotels found to embed" });
      return; 
    }

    // Prepare documents for embedding
    const docs = hotels.map((hotel) => {
      const { _id, location, description, rooms } = hotel;

      // Calculate price based on user preference
      let priceText: string;
      if (rooms.length === 0) {
        priceText = "Price unavailable";
      } else {
        const prices = rooms.map((room) => room.price);
        switch (pricePreference) {
          case "lowest":
            const lowestPrice = Math.min(...prices);
            priceText = `Lowest price per night: $${lowestPrice.toFixed(2)}`;
            break;

          case "suggest":
            if (budget !== undefined) {
              const affordablePrices = prices.filter((p) => p <= budget);
              const suggestedPrice = affordablePrices.length > 0
                ? Math.min(...affordablePrices)
                : Math.min(...prices);
              priceText = affordablePrices.length > 0
                ? `Suggested price within $${budget}: $${suggestedPrice.toFixed(2)}`
                : `No rooms within $${budget}, lowest available: $${suggestedPrice.toFixed(2)}`;
            } else {
              const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
              priceText = `Average price per night: $${avgPrice.toFixed(2)}`;
            }
            break;

          case "average":
          default:
            const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
            priceText = `Average price per night: $${averagePrice.toFixed(2)}`;
            break;
        }
      }

      const pageContent = `${description} Located in ${location}. ${priceText}`;

      return new Document({
        pageContent,
        metadata: { _id: _id.toString() },
      });
    });

  
    const existingIds = new Set(
      (await mongoose.connection.collection("hotelVectors").distinct("_id")).map(id => id.toString())
    );
    const newDocs = docs.filter(doc => !existingIds.has(doc.metadata._id));

    if (newDocs.length === 0) {
      res.status(200).json({ message: "All hotels already embedded" });
      return; 
    }

    
    await vectorIndex.addDocuments(newDocs);

    res.status(200).json({
      message: `Embeddings created for ${newDocs.length} new hotels`,
      embeddedCount: newDocs.length,
    });
   
  } catch (error) {
    console.error("Error creating embeddings:", error);
    next(error);
  }
};