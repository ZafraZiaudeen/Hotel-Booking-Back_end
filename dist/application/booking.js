"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingById = exports.getBookingsForUser = exports.updateBookingStatus = exports.cancelBooking = exports.getRoomAvailability = exports.getAllBookings = exports.getAllBookingsForHotel = exports.createBooking = void 0;
var Booking_1 = __importDefault(require("../infrastructure/schemas/Booking"));
var Hotel_1 = __importDefault(require("../infrastructure/schemas/Hotel"));
var not_found_error_1 = __importDefault(require("../domain/errors/not-found-error"));
var validation_error_1 = __importDefault(require("../domain/errors/validation-error"));
var booking_1 = require("../domain/dtos/booking");
var express_1 = require("@clerk/express");
var createBooking = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var bookingData, _a, hotelId, checkIn, checkOut, roomSelections, specialRequests, hotel, assignedRoomsByType, _loop_1, _i, roomSelections_1, _b, roomType, numRooms, user, booking, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 7, , 8]);
                bookingData = booking_1.createBookingDTO.safeParse(req.body);
                if (!bookingData.success) {
                    throw new validation_error_1.default(bookingData.error.message);
                }
                _a = bookingData.data, hotelId = _a.hotelId, checkIn = _a.checkIn, checkOut = _a.checkOut, roomSelections = _a.roomSelections, specialRequests = _a.specialRequests;
                return [4 /*yield*/, Hotel_1.default.findById(hotelId)];
            case 1:
                hotel = _c.sent();
                if (!hotel) {
                    throw new not_found_error_1.default("Hotel not found");
                }
                assignedRoomsByType = {};
                _loop_1 = function (roomType, numRooms) {
                    var selectedRoom, roomNumbers, overlappingBookings, bookedRoomNumbers, availableRoomNumbers;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                selectedRoom = hotel.rooms.find(function (r) { return r.type === roomType; });
                                if (!selectedRoom) {
                                    throw new validation_error_1.default("Invalid room type: ".concat(roomType));
                                }
                                roomNumbers = Array.from({ length: selectedRoom.to - selectedRoom.from + 1 }, function (_, i) { return (selectedRoom.from + i).toString(); });
                                return [4 /*yield*/, Booking_1.default.find({
                                        hotelId: hotelId,
                                        "roomAssignments.roomType": roomType,
                                        $or: [{ checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }],
                                        status: { $ne: "cancelled" },
                                    })];
                            case 1:
                                overlappingBookings = _d.sent();
                                bookedRoomNumbers = new Set(overlappingBookings.flatMap(function (b) { var _a; return ((_a = b.roomAssignments.find(function (ra) { return ra.roomType === roomType; })) === null || _a === void 0 ? void 0 : _a.roomNumbers) || []; }));
                                availableRoomNumbers = roomNumbers.filter(function (num) { return !bookedRoomNumbers.has(num); });
                                if (availableRoomNumbers.length < numRooms) {
                                    throw new validation_error_1.default("Not enough available rooms for ".concat(roomType, ". Only ").concat(availableRoomNumbers.length, " left."));
                                }
                                assignedRoomsByType[roomType] = availableRoomNumbers.slice(0, numRooms);
                                return [2 /*return*/];
                        }
                    });
                };
                _i = 0, roomSelections_1 = roomSelections;
                _c.label = 2;
            case 2:
                if (!(_i < roomSelections_1.length)) return [3 /*break*/, 5];
                _b = roomSelections_1[_i], roomType = _b.roomType, numRooms = _b.numRooms;
                return [5 /*yield**/, _loop_1(roomType, numRooms)];
            case 3:
                _c.sent();
                _c.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                user = req.auth;
                return [4 /*yield*/, Booking_1.default.create({
                        hotelId: hotelId,
                        userId: user.userId,
                        checkIn: checkIn,
                        checkOut: checkOut,
                        roomAssignments: Object.entries(assignedRoomsByType).map(function (_a) {
                            var roomType = _a[0], roomNumbers = _a[1];
                            return ({
                                roomType: roomType,
                                roomNumbers: roomNumbers,
                            });
                        }),
                        specialRequests: specialRequests,
                        status: "ongoing",
                    })];
            case 6:
                booking = _c.sent();
                console.log("Created booking:", booking);
                // Return booking data at root level
                res.status(201).json({
                    _id: booking._id.toString(),
                    hotelId: booking.hotelId,
                    userId: booking.userId,
                    checkIn: booking.checkIn,
                    checkOut: booking.checkOut,
                    roomAssignments: booking.roomAssignments,
                    specialRequests: booking.specialRequests,
                    status: booking.status,
                });
                return [3 /*break*/, 8];
            case 7:
                error_1 = _c.sent();
                next(error_1);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.createBooking = createBooking;
var getAllBookingsForHotel = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var hotelId, bookings, bookingWithUser, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                hotelId = req.params.hotelId;
                return [4 /*yield*/, Booking_1.default.find({ hotelId: hotelId })];
            case 1:
                bookings = _a.sent();
                return [4 /*yield*/, Promise.all(bookings.map(function (el) { return __awaiter(void 0, void 0, void 0, function () {
                        var user;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, express_1.clerkClient.users.getUser(el.userId)];
                                case 1:
                                    user = _a.sent();
                                    return [2 /*return*/, {
                                            _id: el._id,
                                            hotelId: el.hotelId,
                                            checkIn: el.checkIn,
                                            checkOut: el.checkOut,
                                            roomAssignments: el.roomAssignments,
                                            specialRequests: el.specialRequests,
                                            status: el.status,
                                            user: { id: user.id, firstName: user.firstName, lastName: user.lastName },
                                        }];
                            }
                        });
                    }); }))];
            case 2:
                bookingWithUser = _a.sent();
                if (!bookings.length) {
                    throw new not_found_error_1.default("No bookings found for this hotel");
                }
                res.status(200).json(bookingWithUser);
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                next(error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAllBookingsForHotel = getAllBookingsForHotel;
var getAllBookings = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var bookings, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Booking_1.default.find()];
            case 1:
                bookings = _a.sent();
                res.status(200).json(bookings.map(function (b) { return ({
                    _id: b._id,
                    hotelId: b.hotelId,
                    checkIn: b.checkIn,
                    checkOut: b.checkOut,
                    roomAssignments: b.roomAssignments,
                    specialRequests: b.specialRequests,
                    status: b.status,
                    createdAt: b.createdAt,
                    updatedAt: b.updatedAt,
                }); }));
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAllBookings = getAllBookings;
var getRoomAvailability = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var hotelId, _a, checkIn, checkOut, hotel, checkInDate, checkOutDate, overlappingBookings_1, availability, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                hotelId = req.params.hotelId;
                _a = req.query, checkIn = _a.checkIn, checkOut = _a.checkOut;
                if (!checkIn || !checkOut) {
                    throw new validation_error_1.default("checkIn and checkOut query parameters are required");
                }
                return [4 /*yield*/, Hotel_1.default.findById(hotelId)];
            case 1:
                hotel = _b.sent();
                if (!hotel) {
                    throw new not_found_error_1.default("Hotel not found");
                }
                checkInDate = new Date(checkIn);
                checkOutDate = new Date(checkOut);
                if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
                    throw new validation_error_1.default("Invalid checkIn or checkOut date format");
                }
                return [4 /*yield*/, Booking_1.default.find({
                        hotelId: hotelId,
                        $or: [{ checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }],
                        status: { $ne: "cancelled" },
                    })];
            case 2:
                overlappingBookings_1 = _b.sent();
                availability = hotel.rooms.map(function (room) {
                    var roomNumbers = Array.from({ length: room.to - room.from + 1 }, function (_, i) { return (room.from + i).toString(); });
                    var bookedRoomNumbers = new Set(overlappingBookings_1
                        .filter(function (b) { var _a; return (_a = b.roomAssignments) === null || _a === void 0 ? void 0 : _a.some(function (ra) { return ra.roomType === room.type; }); })
                        .flatMap(function (b) { var _a, _b; return ((_b = (_a = b.roomAssignments) === null || _a === void 0 ? void 0 : _a.find(function (ra) { return ra.roomType === room.type; })) === null || _b === void 0 ? void 0 : _b.roomNumbers) || []; }));
                    var availableCount = roomNumbers.filter(function (num) { return !bookedRoomNumbers.has(num); }).length;
                    return { type: room.type, availableCount: availableCount, price: room.price };
                });
                res.status(200).json({ availableRooms: availability });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _b.sent();
                next(error_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getRoomAvailability = getRoomAvailability;
var cancelBooking = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var bookingId, user, booking, currentTime, creationTime, checkInDate, today, checkInDay, hoursSinceCreation, minutesSinceCreation, isCheckInToday, isWithin48HoursOfCreation, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                bookingId = req.params.bookingId;
                user = req.auth;
                return [4 /*yield*/, Booking_1.default.findById(bookingId)];
            case 1:
                booking = _a.sent();
                if (!booking) {
                    throw new not_found_error_1.default("Booking not found");
                }
                if (booking.userId !== user.userId) {
                    throw new validation_error_1.default("You are not authorized to cancel this booking");
                }
                if (booking.status === "cancelled") {
                    throw new validation_error_1.default("Booking is already cancelled");
                }
                if (booking.status === "completed") {
                    throw new validation_error_1.default("Cannot cancel a completed booking");
                }
                currentTime = new Date();
                creationTime = new Date(booking.createdAt);
                checkInDate = new Date(booking.checkIn);
                today = new Date(currentTime);
                today.setHours(0, 0, 0, 0);
                checkInDay = new Date(checkInDate);
                checkInDay.setHours(0, 0, 0, 0);
                hoursSinceCreation = (currentTime.getTime() - creationTime.getTime()) / (1000 * 60 * 60);
                minutesSinceCreation = (currentTime.getTime() - creationTime.getTime()) / (1000 * 60);
                isCheckInToday = today.getTime() === checkInDay.getTime();
                isWithin48HoursOfCreation = hoursSinceCreation <= 48;
                if (isCheckInToday || isWithin48HoursOfCreation) {
                    // Enforce 30-minute cancellation window
                    if (minutesSinceCreation > 30) {
                        throw new validation_error_1.default("Cancellation is only allowed within 30 minutes of booking creation for bookings on the current date or within 48 hours of creation.");
                    }
                }
                else {
                    // Enforce 48-hour cancellation window for other bookings
                    if (hoursSinceCreation > 48) {
                        throw new validation_error_1.default("Cancellation is only allowed within 48 hours of booking creation.");
                    }
                }
                // Update status to "cancelled"
                booking.status = "cancelled";
                return [4 /*yield*/, booking.save()];
            case 2:
                _a.sent();
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
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                next(error_5);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.cancelBooking = cancelBooking;
// Function to update booking status to "completed" (to be run periodically)
var updateBookingStatus = function () { return __awaiter(void 0, void 0, void 0, function () {
    var currentDate, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                currentDate = new Date();
                return [4 /*yield*/, Booking_1.default.updateMany({
                        checkOut: { $lt: currentDate },
                        status: "ongoing",
                    }, { $set: { status: "completed" } })];
            case 1:
                _a.sent();
                console.log("Booking statuses updated successfully");
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error("Error updating booking statuses:", error_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateBookingStatus = updateBookingStatus;
var getBookingsForUser = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, bookings, bookingsWithHotelDetails, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = req.auth;
                return [4 /*yield*/, Booking_1.default.find({ userId: user.userId })];
            case 1:
                bookings = _a.sent();
                if (!bookings.length) {
                    throw new not_found_error_1.default("No bookings found for this user");
                }
                return [4 /*yield*/, Promise.all(bookings.map(function (booking) { return __awaiter(void 0, void 0, void 0, function () {
                        var hotel, roomAssignmentsWithDetails;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, Hotel_1.default.findById(booking.hotelId)];
                                case 1:
                                    hotel = _a.sent();
                                    if (!hotel) {
                                        throw new not_found_error_1.default("Hotel with ID ".concat(booking.hotelId, " not found"));
                                    }
                                    roomAssignmentsWithDetails = booking.roomAssignments.map(function (ra) {
                                        var room = hotel.rooms.find(function (r) { return r.type === ra.roomType; });
                                        return {
                                            roomType: ra.roomType,
                                            roomNumbers: ra.roomNumbers,
                                            price: room ? room.price : null,
                                        };
                                    });
                                    return [2 /*return*/, {
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
                                        }];
                            }
                        });
                    }); }))];
            case 2:
                bookingsWithHotelDetails = _a.sent();
                res.status(200).json(bookingsWithHotelDetails);
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                next(error_7);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getBookingsForUser = getBookingsForUser;
var getBookingById = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var bookingId, booking, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                bookingId = req.params.bookingId;
                return [4 /*yield*/, Booking_1.default.findById(bookingId)];
            case 1:
                booking = _a.sent();
                if (!booking) {
                    throw new not_found_error_1.default("Booking not found");
                }
                res.status(200).json(booking);
                return [2 /*return*/];
            case 2:
                error_8 = _a.sent();
                next(error_8);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getBookingById = getBookingById;
//# sourceMappingURL=booking.js.map