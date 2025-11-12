import { Request, Response, NextFunction } from "express";
import Booking from "../infrastructure/schemas/Booking";
import Hotel from "../infrastructure/schemas/Hotel";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import { clerkClient } from "@clerk/express";

export const sendBookingReceiptWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      throw new ValidationError("bookingId is required");
    }

    // Fetch booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // Fetch hotel details
    const hotel = await Hotel.findById(booking.hotelId);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }

    // Fetch user details from Clerk
    let userEmail = "";
    let userName = "";
    try {
      const user = await clerkClient.users.getUser(booking.userId);
      console.log("Clerk user data:", user);
      
      // Extract email with better error handling
      if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
        console.error("No email addresses found for user:", booking.userId);
        throw new ValidationError("No email addresses associated with this user account");
      }
      
      userEmail = user.emailAddresses[0].emailAddress;
      if (!userEmail || userEmail.trim() === "") {
        throw new ValidationError("Email address is empty");
      }
      
      userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Guest";
      console.log("Successfully fetched user:", { userEmail, userName });
    } catch (error) {
      console.error("Error fetching user from Clerk:", error);
      throw new ValidationError(`Could not fetch user details: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Calculate booking details
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const numberOfNights = Math.max(
      1,
      Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Calculate total price
    let totalPrice = 0;
    const roomDetails = booking.roomAssignments.map((assignment) => {
      const room = hotel.rooms.find((r) => r.type === assignment.roomType);
      const roomPrice = room ? room.price : 0;
      const roomTotal = roomPrice * assignment.roomNumbers.length * numberOfNights;
      totalPrice += roomTotal;

      return {
        roomType: assignment.roomType,
        roomNumbers: assignment.roomNumbers.join(", "),
        numberOfRooms: assignment.roomNumbers.length,
        pricePerNight: roomPrice,
        subtotal: roomTotal,
      };
    });

    const webhookData = {
      userEmail,
      userName,
      bookingId: booking._id.toString(),
      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,
      specialRequests: booking.specialRequests || "None",
      hotelName: hotel.name,
      hotelLocation: hotel.location,
      hotelImage: hotel.image,
      hotelRating: hotel.rating,
      hotelAmenities: hotel.amenities.join(", "),
      checkInDate: checkInDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      checkOutDate: checkOutDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      numberOfNights,
      roomDetails,
      totalPrice: totalPrice.toFixed(2),
      currency: "USD",
      bookingCreatedAt: new Date(booking.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Call n8n webhook with the data
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      throw new ValidationError("N8N_WEBHOOK_URL is not configured in environment variables");
    }

    console.log("Triggering n8n webhook for booking:", bookingId);
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookData),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("n8n webhook failed:", errorText);
      throw new Error(`Failed to trigger n8n webhook: ${n8nResponse.status} ${errorText}`);
    }

    console.log("Successfully triggered n8n webhook for booking:", bookingId);

    res.status(200).json({
      success: true,
      message: "Booking receipt email sent successfully",
      data: webhookData,
    });
  } catch (error) {
    next(error);
  }
};