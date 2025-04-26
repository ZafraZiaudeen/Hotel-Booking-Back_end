import { Request, Response, NextFunction } from "express";
import Hotel from "../infrastructure/schemas/Hotel";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import { CreateHotelDTO } from "../domain/dtos/hotel";
import Booking from "../infrastructure/schemas/Booking";
import stripe from "../infrastructure/stripe";
import OpenAI from "openai";

export const getAllHotels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location, sortByPrice } = req.query;
    const query: any = {};
    if (location && typeof location === "string") {
      query.location = { $regex: location, $options: "i" };
    }
    let sortOption: 1 | -1 | undefined;
    if (sortByPrice) {
      if (typeof sortByPrice !== "string" || !["asc", "desc"].includes(sortByPrice)) {
        throw new ValidationError("sortByPrice must be either 'asc' or 'desc'");
      }
      sortOption = sortByPrice === "asc" ? 1 : -1;
    }
    const hotels = await Hotel.aggregate([
      { $match: query },
      {
        $addFields: {
          lowestPrice: { $min: "$rooms.price" },
        },
      },
      ...(sortOption ? [{ $sort: { lowestPrice: sortOption } }] : []),
      { $project: { lowestPrice: 0 } },
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

export const getHotelById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotelId = req.params.id;
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }
    res.status(200).json(hotel);
    return;
  } catch (error) {
    next(error);
  }
};

export const generateResponse = async (req: Request, res: Response, next: NextFunction) => {
  const { prompt } = req.body;
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    store: true,
  });
  res.status(200).json({
    message: { role: "assistant", content: completion.choices[0].message.content },
  });
  return;
};
export const createHotel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input using Zod schema
    const validationResult = CreateHotelDTO.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }

    const hotelData = validationResult.data;

    // Create Stripe Prices for each room type
    const roomsWithStripe = await Promise.all(
      hotelData.rooms.map(async (room) => {
        const stripeProduct = await stripe.products.create({
          name: `${hotelData.name} - ${room.type}`,
          description: `Room type ${room.type} at ${hotelData.name}`,
        });

        const stripePrice = await stripe.prices.create({
          unit_amount: Math.round(room.price * 100), // Convert to cents
          currency: "usd",
          product: stripeProduct.id,
        });

        if (!stripePrice.id) {
          throw new Error(`Failed to create Stripe price for room type: ${room.type}`);
        }

        return {
          ...room,
          stripePriceId: stripePrice.id,
        };
      })
    );

    // Create the hotel with validated data and Stripe Price IDs
    const hotel = await Hotel.create({
      ...hotelData,
      rooms: roomsWithStripe,
    });

    res.status(201).json(hotel);
  } catch (error) {
    console.error("Error creating hotel:", error);
    next(error);
  }
};

export const deleteHotel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotelId = req.params.id;
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }
    const activeBookings = await Booking.exists({
      hotelId,
      status: { $in: ["ongoing", "completed"] },
    });
    if (activeBookings) {
      throw new ValidationError("Cannot delete hotel with active or completed bookings");
    }
    await Hotel.findByIdAndDelete(hotelId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// export const updateHotel = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const hotelId = req.params.id;
//     const updatedHotelData = CreateHotelDTO.partial().safeParse(req.body);
//     if (!updatedHotelData.success) {
//       throw new ValidationError(updatedHotelData.error.message);
//     }
//     const existingHotel = await Hotel.findById(hotelId);
//     if (!existingHotel) {
//       throw new NotFoundError(`Hotel with ID ${hotelId} not found`);
//     }
//     if (updatedHotelData.data.rooms) {
//       const roomsWithStripe = await Promise.all(
//         updatedHotelData.data.rooms.map(async (room, index) => {
//           console.log(`Processing room ${index} for update:`, room);
//           if (!room.stripePriceId) {
//             const price = await stripe.prices.create({
//               unit_amount: room.price * 100,
//               currency: "usd",
//               product_data: { name: `${existingHotel.name} - ${room.type}` },
//             });
//             console.log(`Stripe price created for room ${room.type}:`, price);
//             if (!price.id) {
//               throw new Error(`Failed to create Stripe price for room type: ${room.type}`);
//             }
//             return { ...room, stripePriceId: price.id };
//           }
//           return room;
//         })
//       );
//       updatedHotelData.data.rooms = roomsWithStripe;
//     }
//     const hotel = await Hotel.findByIdAndUpdate(
//       hotelId,
//       { $set: updatedHotelData.data },
//       { new: true, runValidators: true }
//     );
//     if (!hotel) {
//       throw new NotFoundError("Hotel not found after update (unexpected)");
//     }
//     res.status(200).json(hotel);
//   } catch (error) {
//     console.error("updateHotel error:", error);
//     next(error);
//   }
// };

export const getTopTrendingHotels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trendingHotels = await Booking.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: "$hotelId", bookingCount: { $sum: 1 } } },
      {
        $lookup: {
          from: "hotels",
          localField: "_id",
          foreignField: "_id",
          as: "hotelDetails",
        },
      },
      { $unwind: "$hotelDetails" },
      { $match: { "hotelDetails.rating": { $gte: 4.0 } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 6 },
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
      .filter((country, index, self) => country && self.indexOf(country) === index);
    res.status(200).json(countries);
  } catch (error) {
    next(error);
  }
};