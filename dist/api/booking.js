"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var authentication_middleware_1 = require("./middleware/authentication-middleware");
var express_1 = __importDefault(require("express"));
var booking_1 = require("../application/booking");
var bookingsRouter = express_1.default.Router();
bookingsRouter.route("/").post(authentication_middleware_1.isAuthenticated, booking_1.createBooking).get(authentication_middleware_1.isAuthenticated, booking_1.getAllBookings);
bookingsRouter.route("/hotels/:hotelId").get(authentication_middleware_1.isAuthenticated, booking_1.getAllBookingsForHotel);
bookingsRouter.route("/:bookingId/cancel").put(authentication_middleware_1.isAuthenticated, booking_1.cancelBooking);
bookingsRouter.route("/:bookingId").get(authentication_middleware_1.isAuthenticated, booking_1.getBookingById);
// Get bookings for the authenticated user
bookingsRouter.route("/user").get(authentication_middleware_1.isAuthenticated, booking_1.getBookingsForUser);
exports.default = bookingsRouter;
//# sourceMappingURL=booking.js.map