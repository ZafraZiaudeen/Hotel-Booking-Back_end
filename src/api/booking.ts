import { isAuthenticated } from './middleware/authentication-middleware';
import express from "express";
import {
  createBooking,
  getAllBookingsForHotel,
  getAllBookings,
  cancelBooking,
  getBookingsForUser,
  getBookingById
} from "../application/booking";

const bookingsRouter = express.Router();

bookingsRouter.route("/").post(isAuthenticated,createBooking).get(isAuthenticated,getAllBookings);
bookingsRouter.route("/hotels/:hotelId").get(isAuthenticated,getAllBookingsForHotel);
bookingsRouter.route("/user").get(isAuthenticated, getBookingsForUser);
bookingsRouter.route("/:bookingId/cancel").put(isAuthenticated, cancelBooking);
bookingsRouter.route("/:bookingId").get(isAuthenticated, getBookingById);
// Get bookings for the authenticated user

export default bookingsRouter;