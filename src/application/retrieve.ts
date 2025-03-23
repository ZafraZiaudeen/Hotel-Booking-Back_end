import { Request, Response, NextFunction } from "express";
import Hotel from "../infrastructure/schemas/Hotel";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import mongoose from "mongoose";

export const retrieve = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query } = req.query;

        if(!query||query===""){
            const hotels = (await Hotel.find()).map((hotel) => ({
               hotel:hotel,
               confidence:1, //what is confidence? confidence is a measure of how sure we are that the hotel is relevant to the query
            }));
           res.status(200).json(hotels);
              return;
        }

        const embeddingModel = new OpenAIEmbeddings({
            model: "text-embedding-ada-002",
            apiKey: process.env.OPENAI_API_KEY
        });

        const vectorIndex = new MongoDBAtlasVectorSearch(embeddingModel, {
            collection: mongoose.connection.collection("hotelVectors"),
            indexName: "vector_index",
        });

        const results = await vectorIndex.similaritySearchWithScore(query as string);

       console.log(results);
       const matchedHotels = await Promise.all( //Promise.all is used to wait for all promises to resolve
              results.map(async (result) => {
                const hotel = await Hotel.findById(result[0].metadata._id);
                return {
                    hotel,
                    confidence:result[1],
                };
              }));


        res.status(200).json(
            matchedHotels.filter((hotel)=> hotel.confidence > 0.92));
        return;
    } catch (error) {
        next(error);
    }
}
