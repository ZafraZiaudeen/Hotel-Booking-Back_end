import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Request,Response,NextFunction } from "express";
import { Document } from "@langchain/core/documents";
import mongoose from "mongoose";
import Hotel from "../infrastructure/schemas/Hotel";

export const createEmbeddings = async (req: Request, res: Response,next:NextFunction) => {
    try{
        const embeddingModel = new OpenAIEmbeddings({
            model: "text-embedding-ada-002",
            apiKey: process.env.OPENAI_API_KEY
        });

        const vectorIndex = new MongoDBAtlasVectorSearch(embeddingModel, {
            collection:mongoose.connection.collection("hotelVectors"),
            indexName: "vector_index",
        });

        const hotels = await Hotel.find({});

        const docs = hotels.map((hotel) => {
        const {_id,location,price,description} = hotel;
        const doc = new Document ({
            pageContent:`${description} Located in${location}. Price per night: ${price}`,
            metadata:{
                _id,
            }
        });
        return doc;
        });

        await vectorIndex.addDocuments(docs);
        res.status(200).json({message:"Embeddings created"});
    }catch(error){
        next(error);
    }
}