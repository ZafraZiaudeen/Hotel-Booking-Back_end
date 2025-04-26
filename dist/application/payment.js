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
exports.retrieveSessionStatus = exports.createCheckoutSession = exports.handleWebhook = void 0;
var Booking_1 = __importDefault(require("../infrastructure/schemas/Booking"));
var stripe_1 = __importDefault(require("../infrastructure/stripe"));
var Hotel_1 = __importDefault(require("../infrastructure/schemas/Hotel"));
var not_found_error_1 = __importDefault(require("../domain/errors/not-found-error"));
var validation_error_1 = __importDefault(require("../domain/errors/validation-error"));
var endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
var FRONTEND_URL = process.env.FRONTEND_URL;
//console.log(STRIPE_WEBHOOK_SECRET);
function fulfillCheckout(sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        var checkoutSession, booking;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Fulfilling Checkout Session " + sessionId);
                    return [4 /*yield*/, stripe_1.default.checkout.sessions.retrieve(sessionId, {
                            expand: ["line_items"],
                        })];
                case 1:
                    checkoutSession = _b.sent();
                    return [4 /*yield*/, Booking_1.default.findById((_a = checkoutSession.metadata) === null || _a === void 0 ? void 0 : _a.bookingId)];
                case 2:
                    booking = _b.sent();
                    if (!booking) {
                        throw new not_found_error_1.default("Booking not found");
                    }
                    if (["PAID", "CANCELLED"].includes(booking.paymentStatus)) {
                        console.log("Booking ".concat(booking._id, " already fulfilled with status ").concat(booking.paymentStatus));
                        return [2 /*return*/];
                    }
                    if (booking.paymentStatus !== "PENDING") {
                        throw new validation_error_1.default("Booking payment status is ".concat(booking.paymentStatus, ", expected PENDING"));
                    }
                    if (checkoutSession.payment_status !== "paid") {
                        throw new validation_error_1.default("Checkout session payment status is ".concat(checkoutSession.payment_status, ", expected paid"));
                    }
                    return [4 /*yield*/, Booking_1.default.findByIdAndUpdate(booking._id, {
                            paymentStatus: "PAID",
                            updatedAt: new Date(),
                        })];
                case 3:
                    _b.sent();
                    console.log("Fulfilled booking ".concat(booking._id, " for Checkout Session ").concat(sessionId));
                    return [2 /*return*/];
            }
        });
    });
}
var handleWebhook = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var payload, sig, event, error_1, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                payload = req.body;
                sig = req.headers["stripe-signature"];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 7, , 8]);
                event = stripe_1.default.webhooks.constructEvent(payload, sig, endpointSecret);
                if (!(event.type === "checkout.session.completed" ||
                    event.type === "checkout.session.async_payment_succeeded")) return [3 /*break*/, 6];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, fulfillCheckout(event.data.object.id)];
            case 3:
                _a.sent();
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error("Error fulfilling checkout session ".concat(event.data.object.id, ":"), error_1);
                res.status(200).send();
                return [2 /*return*/];
            case 5:
                res.status(200).send();
                return [2 /*return*/];
            case 6:
                res.status(200).send();
                return [3 /*break*/, 8];
            case 7:
                err_1 = _a.sent();
                console.error("Webhook error:", err_1);
                res.status(400).send("Webhook Error: ".concat(err_1.message));
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.handleWebhook = handleWebhook;
var createCheckoutSession = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var bookingId, booking, hotel_1, checkIn_1, checkOut_1, numberOfNights_1, line_items, session, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                bookingId = req.body.bookingId;
                // Validate input
                if (!bookingId) {
                    throw new validation_error_1.default("bookingId is required");
                }
                return [4 /*yield*/, Booking_1.default.findById(bookingId)];
            case 1:
                booking = _a.sent();
                if (!booking) {
                    throw new not_found_error_1.default("Booking not found");
                }
                return [4 /*yield*/, Hotel_1.default.findById(booking.hotelId)];
            case 2:
                hotel_1 = _a.sent();
                if (!hotel_1) {
                    throw new not_found_error_1.default("Hotel not found");
                }
                checkIn_1 = new Date(booking.checkIn);
                checkOut_1 = new Date(booking.checkOut);
                if (isNaN(checkIn_1.getTime()) || isNaN(checkOut_1.getTime())) {
                    throw new validation_error_1.default("Invalid check-in or check-out date");
                }
                numberOfNights_1 = Math.max(1, Math.ceil((checkOut_1.getTime() - checkIn_1.getTime()) / (1000 * 60 * 60 * 24)));
                line_items = booking.roomAssignments.map(function (assignment) {
                    var room = hotel_1.rooms.find(function (r) { return r.type === assignment.roomType; });
                    if (!room) {
                        throw new not_found_error_1.default("Room type ".concat(assignment.roomType, " not found in hotel ").concat(hotel_1.name));
                    }
                    var totalPrice = room.price * assignment.roomNumbers.length * numberOfNights_1;
                    return {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: "".concat(assignment.roomType, " Room"),
                                description: "Booking for ".concat(assignment.roomNumbers.length, " ").concat(assignment.roomType, " room(s) from ").concat(checkIn_1.toDateString(), " to ").concat(checkOut_1.toDateString()),
                            },
                            unit_amount: Math.round((totalPrice / (assignment.roomNumbers.length * numberOfNights_1)) * 100), // Price per night per room
                        },
                        quantity: assignment.roomNumbers.length * numberOfNights_1,
                    };
                });
                if (line_items.length === 0) {
                    throw new validation_error_1.default("No valid room assignments found for the booking");
                }
                return [4 /*yield*/, stripe_1.default.checkout.sessions.create({
                        ui_mode: "embedded",
                        line_items: line_items,
                        mode: "payment",
                        return_url: "".concat(FRONTEND_URL, "/booking/complete?session_id={CHECKOUT_SESSION_ID}"),
                        metadata: {
                            bookingId: bookingId.toString(),
                        },
                    })];
            case 3:
                session = _a.sent();
                console.log("Checkout Session created:", session.id);
                res.status(200).json({ clientSecret: session.client_secret });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _a.sent();
                console.error("Error creating checkout session:", error_2);
                res.status(error_2 instanceof not_found_error_1.default ? 404 : 400).json({
                    message: "Failed to create checkout session",
                    error: error_2 instanceof Error ? error_2.message : String(error_2),
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.createCheckoutSession = createCheckoutSession;
var retrieveSessionStatus = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, checkoutSession, booking, hotel, error_3;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 4, , 5]);
                sessionId = req.query.session_id;
                if (!sessionId) {
                    throw new validation_error_1.default("session_id is required");
                }
                return [4 /*yield*/, stripe_1.default.checkout.sessions.retrieve(sessionId)];
            case 1:
                checkoutSession = _c.sent();
                return [4 /*yield*/, Booking_1.default.findById((_a = checkoutSession.metadata) === null || _a === void 0 ? void 0 : _a.bookingId)];
            case 2:
                booking = _c.sent();
                if (!booking) {
                    throw new not_found_error_1.default("Booking not found");
                }
                return [4 /*yield*/, Hotel_1.default.findById(booking.hotelId)];
            case 3:
                hotel = _c.sent();
                if (!hotel) {
                    throw new not_found_error_1.default("Hotel not found");
                }
                res.status(200).json({
                    bookingId: booking._id,
                    booking: booking,
                    hotel: hotel,
                    status: checkoutSession.status,
                    customer_email: ((_b = checkoutSession.customer_details) === null || _b === void 0 ? void 0 : _b.email) || null,
                    paymentStatus: booking.paymentStatus,
                });
                return [3 /*break*/, 5];
            case 4:
                error_3 = _c.sent();
                console.error("Error retrieving session status:", error_3);
                res.status(error_3 instanceof not_found_error_1.default ? 404 : 400).json({
                    message: "Failed to retrieve session status",
                    error: error_3 instanceof Error ? error_3.message : String(error_3),
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.retrieveSessionStatus = retrieveSessionStatus;
//# sourceMappingURL=payment.js.map