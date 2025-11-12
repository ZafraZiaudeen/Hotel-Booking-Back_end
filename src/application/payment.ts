import { Request, Response } from "express";
import Booking from "../infrastructure/schemas/Booking";
import stripe from "../infrastructure/stripe";
import Hotel from "../infrastructure/schemas/Hotel";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import { clerkClient } from "@clerk/express";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
const FRONTEND_URL = process.env.FRONTEND_URL as string;
//console.log(STRIPE_WEBHOOK_SECRET);
async function fulfillCheckout(sessionId: string) {
  console.log("Fulfilling Checkout Session " + sessionId);

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });

  const booking = await Booking.findById(checkoutSession.metadata?.bookingId);
  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (["PAID", "CANCELLED"].includes(booking.paymentStatus)) {
    console.log(`Booking ${booking._id} already fulfilled with status ${booking.paymentStatus}`);
    return;
  }

  if (booking.paymentStatus !== "PENDING") {
    throw new ValidationError(`Booking payment status is ${booking.paymentStatus}, expected PENDING`);
  }

  if (checkoutSession.payment_status !== "paid") {
    throw new ValidationError(`Checkout session payment status is ${checkoutSession.payment_status}, expected paid`);
  }

  await Booking.findByIdAndUpdate(booking._id, {
    paymentStatus: "PAID",
    updatedAt: new Date(),
  });

  console.log(`Fulfilled booking ${booking._id} for Checkout Session ${sessionId}`);

  // Trigger n8n webhook for sending booking receipt email
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nWebhookUrl) {
    try {
      // Fetch hotel and user details for the email
      const hotel = await Hotel.findById(booking.hotelId);
      const user = await clerkClient.users.getUser(booking.userId);
      
      if (hotel && user) {
        const userEmail = user.emailAddresses[0]?.emailAddress;
        const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Guest";

        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        const numberOfNights = Math.max(
          1,
          Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
        );

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

        const webhookPayload = {
          userEmail,
          userName,
          bookingId: booking._id.toString(),
          bookingStatus: booking.status,
          paymentStatus: "PAID",
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

        const response = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        });

        if (response.ok) {
          console.log(`Successfully triggered n8n webhook for booking ${booking._id}`);
        } else {
          console.error(`Failed to trigger n8n webhook: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Error triggering n8n webhook:", error);
      // Don't throw error to prevent payment fulfillment from failing
    }
  } else {
    console.log("N8N_WEBHOOK_URL not configured, skipping email notification");
  }
}

export const handleWebhook = async (req: Request, res: Response) => {
  const payload = req.body;
  const sig = req.headers["stripe-signature"] as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      try {
        await fulfillCheckout(event.data.object.id);
      } catch (error) {
        console.error(`Error fulfilling checkout session ${event.data.object.id}:`, error);
        res.status(200).send();
        return;
      }

      res.status(200).send();
      return;
    }

    res.status(200).send();
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;

    // Validate input
    if (!bookingId) {
      throw new ValidationError("bookingId is required");
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const hotel = await Hotel.findById(booking.hotelId);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }

    // Calculate number of nights
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new ValidationError("Invalid check-in or check-out date");
    }
    const numberOfNights = Math.max(
      1,
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Generate line items from booking.roomAssignments
    const line_items = booking.roomAssignments.map((assignment) => {
      const room = hotel.rooms.find((r) => r.type === assignment.roomType);
      if (!room) {
        throw new NotFoundError(`Room type ${assignment.roomType} not found in hotel ${hotel.name}`);
      }
      const totalPrice = room.price * assignment.roomNumbers.length * numberOfNights;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${assignment.roomType} Room`,
            description: `Booking for ${assignment.roomNumbers.length} ${assignment.roomType} room(s) from ${checkIn.toDateString()} to ${checkOut.toDateString()}`,
          },
          unit_amount: Math.round((totalPrice / (assignment.roomNumbers.length * numberOfNights)) * 100), // Price per night per room
        },
        quantity: assignment.roomNumbers.length * numberOfNights,
      };
    });

    if (line_items.length === 0) {
      throw new ValidationError("No valid room assignments found for the booking");
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items,
      mode: "payment",
      return_url: `${FRONTEND_URL}/booking/complete?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        bookingId: bookingId.toString(),
      },
    });
    console.log("Return URL:", session.return_url);
    console.log("Checkout Session created:", session.id);
    res.status(200).json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(error instanceof NotFoundError ? 404 : 400).json({
      message: "Failed to create checkout session",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const retrieveSessionStatus = async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      throw new ValidationError("session_id is required");
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const booking = await Booking.findById(checkoutSession.metadata?.bookingId);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const hotel = await Hotel.findById(booking.hotelId);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }

    res.status(200).json({
      bookingId: booking._id,
      booking,
      hotel,
      status: checkoutSession.status,
      customer_email: checkoutSession.customer_details?.email || null,
      paymentStatus: booking.paymentStatus,
    });
  } catch (error) {
    console.error("Error retrieving session status:", error);
    res.status(error instanceof NotFoundError ? 404 : 400).json({
      message: "Failed to retrieve session status",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};