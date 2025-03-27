import { isAuthenticated } from './middleware/authentication-middleware';
import express from "express";
import {
  createBooking,
  getAllBookingsForHotel,
  getAllBookings,
  cancelBooking,
  getBookingsForUser
} from "../application/booking";

const bookingsRouter = express.Router();

bookingsRouter.route("/").post(isAuthenticated,createBooking).get(isAuthenticated,getAllBookings);
bookingsRouter.route("/hotels/:hotelId").get(isAuthenticated,getAllBookingsForHotel);
bookingsRouter.route("/:bookingId/cancel").put(isAuthenticated, cancelBooking);

// Get bookings for the authenticated user
bookingsRouter.route("/user").get(isAuthenticated, getBookingsForUser);
export default bookingsRouter;