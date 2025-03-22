import { Request, Response, NextFunction } from "express";
import Booking from "../infrastructure/schemas/Booking";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import { createBookingDTO } from "../domain/dtos/booking";
import { clerkClient, User } from "@clerk/express";

export const createBooking = async (req:Request, res:Response, next:NextFunction) => {
  try {
    const booking = createBookingDTO.safeParse(req.body);

    if (!booking.success) {
      throw new ValidationError(booking.error.message);
    }

    // // Validate the request data
    // if (
    //   !booking.hotelId ||
    //   !booking.checkIn ||
    //   !booking.checkOut ||
    //   !booking.roomNumber
    // ) {
    //   throw new ValidationError("All fields are required");
    // }
    console.log(booking);
    
    const user = req.auth;
    //Add the booking
    await Booking.create({
      hotelId: booking.data.hotelId,
      userId: user.userId,
      checkIn: booking.data.checkIn,
      checkOut: booking.data.checkOut,
      roomNumber: booking.data.roomNumber,
    });

    // Return the response
    res.status(201).send();
    return;
  } catch (error) {
    next(error);
  }
};

export const getAllBookingsForHotel = async(req:Request, res:Response, next:NextFunction) => {
  try {
    const hotelId = req.params.hotelId;
    const bookings = await Booking.find({ hotelId: hotelId });
    const bookingWithUser =await Promise.all( bookings.map(async(el) => {
      const user = await clerkClient.users.getUser(el.userId);
      return { _id: el._id, hotelId: el.hotelId, checkIn: el.checkIn, checkOut: el.checkOut, roomNumber: el.roomNumber, user: { id: user.id, firstName: user.firstName, lastName: user.lastName } };    }));

    if (!bookings) {
      throw new NotFoundError("No bookings found for this hotel");
    }

    res.status(200).json(bookingWithUser);
    return;
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req:Request, res:Response, next:NextFunction) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
    return;
  } catch (error) {
    next(error);
  }
};
