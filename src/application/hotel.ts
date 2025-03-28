import { Request, Response,NextFunction } from "express";
import Hotel from "../infrastructure/schemas/Hotel";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import { CreateHotelDTO } from "../domain/dtos/hotel";
import Booking from "../infrastructure/schemas/Booking";

import OpenAI from "openai";
export const getAllHotels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract query parameters
    const { location, sortByPrice } = req.query;

    // Build the query for filtering
    const query: any = {};

    // location filter if provided
    if (location && typeof location === "string") {
      query.location = { $regex: location, $options: "i" }; 
    }

    // Validate sortByPrice parameter
    let sortOption: 1 | -1 | undefined;
    if (sortByPrice) {
      if (typeof sortByPrice !== "string" || !["asc", "desc"].includes(sortByPrice)) {
        throw new ValidationError("sortByPrice must be either 'asc' or 'desc'");
      }
      sortOption = sortByPrice === "asc" ? 1 : -1;
    }

    // aggregation pipeline to compute the lowest price and sort
    const hotels = await Hotel.aggregate([
      { $match: query },
      {
        $addFields: {
          lowestPrice: {
            $min: "$rooms.price", 
          },
        },
      },
      ...(sortOption ? [{ $sort: { lowestPrice: sortOption } }] : []),
      {
        $project: {
          lowestPrice: 0, 
        },
      },
    ]);

    if (!hotels || hotels.length === 0) {
      throw new NotFoundError("No hotels found matching the criteria");
    }

    res.status(200).json(hotels);
    return;
  } catch (error) {
    next(error);
  }
};

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

export const createHotel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hotel = CreateHotelDTO.safeParse(req.body);
  
      if (!hotel.success) {
        throw new ValidationError(hotel.error.message);
      }
  
      const newHotel = await Hotel.create({
        name: hotel.data.name,
        location: hotel.data.location,
        image: hotel.data.image,
        description: hotel.data.description,
        rating: hotel.data.rating,
        reviews: hotel.data.reviews,
        amenities: hotel.data.amenities || [],
        rooms: hotel.data.rooms, 
      });
  
      res.status(201).json(newHotel);
      return;
    } catch (error) {
      next(error);
    }
  };

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
export const updateHotel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotelId = req.params.id; 

    const updatedHotelData = CreateHotelDTO.partial().safeParse(req.body);
    if (!updatedHotelData.success) {
      throw new ValidationError(updatedHotelData.error.message);
    }

    // Check if the hotel exists before attempting to update
    const existingHotel = await Hotel.findById(hotelId);
  
    if (!existingHotel) {
      throw new NotFoundError(`Hotel with ID ${hotelId} not found`);
    }

    // Perform the update
    const hotel = await Hotel.findByIdAndUpdate(
      hotelId,
      { $set: updatedHotelData.data }, 
      { new: true, runValidators: true } 
    );

    
    if (!hotel) {
      throw new NotFoundError("Hotel not found after update (unexpected)");
    }

    console.log("Updated Hotel:", hotel);
    res.status(200).json(hotel);
  } catch (error) {
    console.error("Error in updateHotel:", error);
    next(error);
  }
};

export const getTopTrendingHotels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trendingHotels = await Booking.aggregate([
      { $match: { status: { $ne: "cancelled" } } }, // Exclude cancelled bookings
      { $group: { _id: "$hotelId", bookingCount: { $sum: 1 } } }, // Count bookings per hotel
      {
        $lookup: {
          from: "hotels",
          localField: "_id",
          foreignField: "_id",
          as: "hotelDetails",
        },
      },
      { $unwind: "$hotelDetails" },
      { $match: { "hotelDetails.rating": { $gte: 4.0 } } }, // Filter for rating >= 4.0
      { $sort: { bookingCount: -1 } }, // Sort by booking count descending
      { $limit: 6 }, // Limit to top 6
      {
        $project: {
          _id: "$hotelDetails._id",
          name: "$hotelDetails.name",
          location: "$hotelDetails.location",
          image: "$hotelDetails.image",
          description: "$hotelDetails.description",
          rating: "$hotelDetails.rating",
          reviews: "$hotelDetails.reviews",
          amenities: "$hotelDetails.amenities",
          rooms: "$hotelDetails.rooms",
          bookingCount: 1,
        },
      },
    ]);

    if (!trendingHotels.length) {
      throw new NotFoundError("No trending hotels found with rating >= 4.0");
    }

    res.status(200).json(trendingHotels);
  } catch (error) {
    next(error);
  }
};

export const getHotelLocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locations = await Hotel.distinct("location");

    const countries = locations
      .map((location) => {
        const parts = location.split(", ");
        return parts[parts.length - 1]; 
      })
      .filter((country, index, self) => 
        country && self.indexOf(country) === index 
      );

    res.status(200).json(countries);
  } catch (error) {
    next(error);
  }
};