import { Request, Response, NextFunction } from "express";
import Booking from "../infrastructure/schemas/Booking";
import Hotel from "../infrastructure/schemas/Hotel";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import { createBookingDTO } from "../domain/dtos/booking";
import { clerkClient } from "@clerk/express";

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookingData = createBookingDTO.safeParse(req.body);

    if (!bookingData.success) {
      throw new ValidationError(bookingData.error.message);
    }

    const { hotelId, checkIn, checkOut, roomSelections, specialRequests } = bookingData.data;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }

    const assignedRoomsByType: { [key: string]: string[] } = {};
    for (const { roomType, numRooms } of roomSelections) {
      const selectedRoom = hotel.rooms.find((r) => r.type === roomType);
      if (!selectedRoom) {
        throw new ValidationError(`Invalid room type: ${roomType}`);
      }

      const roomNumbers = Array.from(
        { length: selectedRoom.to - selectedRoom.from + 1 },
        (_, i) => (selectedRoom.from + i).toString()
      );

      const overlappingBookings = await Booking.find({
        hotelId,
        "roomAssignments.roomType": roomType,
        $or: [{ checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }],
        status: { $ne: "cancelled" }, 
      });

      const bookedRoomNumbers = new Set(
        overlappingBookings.flatMap((b) =>
          b.roomAssignments.find((ra) => ra.roomType === roomType)?.roomNumbers || []
        )
      );
      const availableRoomNumbers = roomNumbers.filter((num) => !bookedRoomNumbers.has(num));

      if (availableRoomNumbers.length < numRooms) {
        throw new ValidationError(
          `Not enough available rooms for ${roomType}. Only ${availableRoomNumbers.length} left.`
        );
      }

      assignedRoomsByType[roomType] = availableRoomNumbers.slice(0, numRooms);
    }

    const user = req.auth;

    const booking = await Booking.create({
      hotelId,
      userId: user.userId,
      checkIn,
      checkOut,
      roomAssignments: Object.entries(assignedRoomsByType).map(([roomType, roomNumbers]) => ({
        roomType,
        roomNumbers,
      })),
      specialRequests,
      status: "ongoing",
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking: {
        _id: booking._id,
        hotelId: booking.hotelId,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        roomAssignments: booking.roomAssignments,
        specialRequests: booking.specialRequests,
        status: booking.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBookingsForHotel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotelId = req.params.hotelId;
    const bookings = await Booking.find({ hotelId });
    const bookingWithUser = await Promise.all(
      bookings.map(async (el) => {
        const user = await clerkClient.users.getUser(el.userId);
        return {
          _id: el._id,
          hotelId: el.hotelId,
          checkIn: el.checkIn,
          checkOut: el.checkOut,
          roomAssignments: el.roomAssignments,
          specialRequests: el.specialRequests,
          status: el.status,
          user: { id: user.id, firstName: user.firstName, lastName: user.lastName },
        };
      })
    );

    if (!bookings.length) {
      throw new NotFoundError("No bookings found for this hotel");
    }

    res.status(200).json(bookingWithUser);
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(
      bookings.map((b) => ({
        _id: b._id,
        hotelId: b.hotelId,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        roomAssignments: b.roomAssignments,
        specialRequests: b.specialRequests,
        status: b.status,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }))
    );
  } catch (error) {
    next(error);
  }
};

export const getRoomAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      throw new ValidationError("checkIn and checkOut query parameters are required");
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }

    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      throw new ValidationError("Invalid checkIn or checkOut date format");
    }

    const overlappingBookings = await Booking.find({
      hotelId,
      $or: [{ checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }],
      status: { $ne: "cancelled" }, 
    });

    const availability = hotel.rooms.map((room) => {
      const roomNumbers = Array.from(
        { length: room.to - room.from + 1 },
        (_, i) => (room.from + i).toString()
      );
      const bookedRoomNumbers = new Set(
        overlappingBookings
          .filter((b) => b.roomAssignments?.some((ra) => ra.roomType === room.type))
          .flatMap((b) => b.roomAssignments?.find((ra) => ra.roomType === room.type)?.roomNumbers || [])
      );
      const availableCount = roomNumbers.filter((num) => !bookedRoomNumbers.has(num)).length;

      return { type: room.type, availableCount, price: room.price };
    });

    res.status(200).json({ availableRooms: availability });
  } catch (error) {
    next(error);
  }
};
export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.params;
    const user = req.auth;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.userId !== user.userId) {
      throw new ValidationError("You are not authorized to cancel this booking");
    }

    if (booking.status === "cancelled") {
      throw new ValidationError("Booking is already cancelled");
    }

    if (booking.status === "completed") {
      throw new ValidationError("Cannot cancel a completed booking");
    }

    const currentTime = new Date();
    const creationTime = new Date(booking.createdAt);
    const checkInDate = new Date(booking.checkIn);

    const today = new Date(currentTime);
    today.setHours(0, 0, 0, 0);
    const checkInDay = new Date(checkInDate);
    checkInDay.setHours(0, 0, 0, 0);

    // Calculate time since booking creation in hours and minutes
    const hoursSinceCreation = (currentTime.getTime() - creationTime.getTime()) / (1000 * 60 * 60);
    const minutesSinceCreation = (currentTime.getTime() - creationTime.getTime()) / (1000 * 60);

    // Check if the booking is for the current date or within 48 hours of creation
    const isCheckInToday = today.getTime() === checkInDay.getTime();
    const isWithin48HoursOfCreation = hoursSinceCreation <= 48;

    if (isCheckInToday || isWithin48HoursOfCreation) {
      // Enforce 30-minute cancellation window
      if (minutesSinceCreation > 30) {
        throw new ValidationError(
          "Cancellation is only allowed within 30 minutes of booking creation for bookings on the current date or within 48 hours of creation."
        );
      }
    } else {
      // Enforce 48-hour cancellation window for other bookings
      if (hoursSinceCreation > 48) {
        throw new ValidationError("Cancellation is only allowed within 48 hours of booking creation.");
      }
    }

    // Update status to "cancelled"
    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking: {
        _id: booking._id,
        hotelId: booking.hotelId,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        roomAssignments: booking.roomAssignments,
        specialRequests: booking.specialRequests,
        status: booking.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Function to update booking status to "completed" (to be run periodically)
export const updateBookingStatus = async () => {
  try {
    const currentDate = new Date();
    await Booking.updateMany(
      {
        checkOut: { $lt: currentDate },
        status: "ongoing",
      },
      { $set: { status: "completed" } }
    );
    console.log("Booking statuses updated successfully");
  } catch (error) {
    console.error("Error updating booking statuses:", error);
  }
};

export const getBookingsForUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.auth;

    // Fetch bookings for the authenticated user
    const bookings = await Booking.find({ userId: user.userId });
    if (!bookings.length) {
      throw new NotFoundError("No bookings found for this user");
    }

    // Fetch hotel details for each booking
    const bookingsWithHotelDetails = await Promise.all(
      bookings.map(async (booking) => {
        const hotel = await Hotel.findById(booking.hotelId);
        if (!hotel) {
          throw new NotFoundError(`Hotel with ID ${booking.hotelId} not found`);
        }

        // Map room assignments to include price and room numbers
        const roomAssignmentsWithDetails = booking.roomAssignments.map((ra) => {
          const room = hotel.rooms.find((r) => r.type === ra.roomType);
          return {
            roomType: ra.roomType,
            roomNumbers: ra.roomNumbers,
            price: room ? room.price : null,
          };
        });

        return {
          _id: booking._id,
          hotelId: booking.hotelId,
          hotelName: hotel.name,
          location: hotel.location,
          image: hotel.image,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          roomAssignments: roomAssignmentsWithDetails,
          specialRequests: booking.specialRequests,
          status: booking.status,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        };
      })
    );

    res.status(200).json(bookingsWithHotelDetails);
  } catch (error) {
    next(error);
  }
};