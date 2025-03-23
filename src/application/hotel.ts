import { Request, Response,NextFunction } from "express";
import Hotel from "../infrastructure/schemas/Hotel";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import { CreateHotelDTO } from "../domain/dtos/hotel";

import OpenAI from "openai";

export const getAllHotels = async (req:Request, res:Response,next:NextFunction) => {
   try{
    const hotels=await Hotel.find({});
    res.status(200).json(hotels);
  return;
   }catch(error){
       next(error);

   }
}

export const getHotelById = async (req:Request, res:Response,next:NextFunction) => {
    try{
        const hotelId = req.params.id;
        const hotel = await Hotel.findById(hotelId);
        if(!hotel) {
           throw new NotFoundError("Hotel not found");
        }
        res.status(200).json(hotel);
        return;
    }catch(error){
        next(error);
    }
    
}

export const generateResponse =async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const {prompt} = req.body;

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
        model:"gpt-4o",
        messages:[
        //     {role:"system",
        //     content: 
        //     `You are an assistant that will catgorize the words that a user gives and give the labels and show an output.
        //     Return this response as a following example:
        //     user:Lake,Cat,dog,tree;
        //     respinse:[{label:Nature,words:['Cat','dog']}]`
        // },
          {role:"user",content:prompt},  
        ],
        store:true,
    });

    res.status(200).
    json({ 
        message:
        {role:"assistant" ,
            content:completion.choices[0].message.content}});
    return;
};  

export const createHotel = async (req:Request, res:Response,next:NextFunction) => {
    try{
        const hotel = CreateHotelDTO.safeParse(req.body); // safeparse checks of the req body is in the shape of createDTO
    
       if(!hotel.success){ // if the req body is not in the shape of createDTO
           throw new ValidationError(hotel.error.message);
         }
        //add the new hotel to the array
       await Hotel.create({
        name: hotel.data.name,
        location: hotel.data.location,
        image: hotel.data.image,
        price: hotel.data.price, 
        description: hotel.data.description,
       })
        //return the response
        res.status(201).send();
        return; // this is to signify function is exiting
    }catch(error){
        next(error);
    }
}

export const deleteHotel = async (req:Request, res:Response,next:NextFunction) => {
    try{
        const hotelId = req.params.id;
    
    await Hotel.findByIdAndDelete(hotelId)
    
        //return the response
        res.status(200).send();
        return;

    }catch(error){
        next(error);
    }
}

export const updateHotel = async (req:Request, res:Response,next:NextFunction) => {
   try{
    const hotelId = req.params.hotelId;
    const updatedHotel = req.body;
  
    // Validate the request data
    if (
      !updatedHotel.name ||
      !updatedHotel.location ||
      !updatedHotel.rating ||
      !updatedHotel.reviews ||
      !updatedHotel.image ||
      !updatedHotel.price ||
      !updatedHotel.description
    ) {
     throw new ValidationError("Invalid hotel data");
    }
  
    await Hotel.findByIdAndUpdate(hotelId, updatedHotel);
  
    // Return the response
    res.status(200).send();
    return;
}catch(error){
    next(error);
}
  };