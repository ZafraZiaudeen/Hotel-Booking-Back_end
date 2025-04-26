"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHotelLocations = exports.getTopTrendingHotels = exports.deleteHotel = exports.createHotel = exports.generateResponse = exports.getHotelById = exports.getAllHotels = void 0;
var Hotel_1 = __importDefault(require("../infrastructure/schemas/Hotel"));
var not_found_error_1 = __importDefault(require("../domain/errors/not-found-error"));
var validation_error_1 = __importDefault(require("../domain/errors/validation-error"));
var hotel_1 = require("../domain/dtos/hotel");
var Booking_1 = __importDefault(require("../infrastructure/schemas/Booking"));
var stripe_1 = __importDefault(require("../infrastructure/stripe"));
var openai_1 = __importDefault(require("openai"));
var getAllHotels = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, location, sortByPrice, query, sortOption, hotels_1, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, location = _a.location, sortByPrice = _a.sortByPrice;
                query = {};
                if (location && typeof location === "string") {
                    query.location = { $regex: location, $options: "i" };
                }
                sortOption = void 0;
                if (sortByPrice) {
                    if (typeof sortByPrice !== "string" || !["asc", "desc"].includes(sortByPrice)) {
                        throw new validation_error_1.default("sortByPrice must be either 'asc' or 'desc'");
                    }
                    sortOption = sortByPrice === "asc" ? 1 : -1;
                }
                return [4 /*yield*/, Hotel_1.default.aggregate(__spreadArray(__spreadArray([
                        { $match: query },
                        {
                            $addFields: {
                                lowestPrice: { $min: "$rooms.price" },
                            },
                        }
                    ], (sortOption ? [{ $sort: { lowestPrice: sortOption } }] : []), true), [
                        { $project: { lowestPrice: 0 } },
                    ], false))];
            case 1:
                hotels_1 = _b.sent();
                if (!hotels_1 || hotels_1.length === 0) {
                    throw new not_found_error_1.default("No hotels found matching the criteria");
                }
                res.status(200).json(hotels_1);
                return [2 /*return*/];
            case 2:
                error_1 = _b.sent();
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAllHotels = getAllHotels;
var getHotelById = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var hotelId, hotel, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                hotelId = req.params.id;
                return [4 /*yield*/, Hotel_1.default.findById(hotelId)];
            case 1:
                hotel = _a.sent();
                if (!hotel) {
                    throw new not_found_error_1.default("Hotel not found");
                }
                res.status(200).json(hotel);
                return [2 /*return*/];
            case 2:
                error_2 = _a.sent();
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getHotelById = getHotelById;
var generateResponse = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var prompt, openai, completion;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                prompt = req.body.prompt;
                openai = new openai_1.default({
                    apiKey: process.env.OPENAI_API_KEY,
                });
                return [4 /*yield*/, openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [{ role: "user", content: prompt }],
                        store: true,
                    })];
            case 1:
                completion = _a.sent();
                res.status(200).json({
                    message: { role: "assistant", content: completion.choices[0].message.content },
                });
                return [2 /*return*/];
        }
    });
}); };
exports.generateResponse = generateResponse;
var createHotel = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var validationResult, hotelData_1, roomsWithStripe, hotel, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                validationResult = hotel_1.CreateHotelDTO.safeParse(req.body);
                if (!validationResult.success) {
                    throw new validation_error_1.default(validationResult.error.message);
                }
                hotelData_1 = validationResult.data;
                return [4 /*yield*/, Promise.all(hotelData_1.rooms.map(function (room) { return __awaiter(void 0, void 0, void 0, function () {
                        var stripeProduct, stripePrice;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, stripe_1.default.products.create({
                                        name: "".concat(hotelData_1.name, " - ").concat(room.type),
                                        description: "Room type ".concat(room.type, " at ").concat(hotelData_1.name),
                                    })];
                                case 1:
                                    stripeProduct = _a.sent();
                                    return [4 /*yield*/, stripe_1.default.prices.create({
                                            unit_amount: Math.round(room.price * 100), // Convert to cents
                                            currency: "usd",
                                            product: stripeProduct.id,
                                        })];
                                case 2:
                                    stripePrice = _a.sent();
                                    if (!stripePrice.id) {
                                        throw new Error("Failed to create Stripe price for room type: ".concat(room.type));
                                    }
                                    return [2 /*return*/, __assign(__assign({}, room), { stripePriceId: stripePrice.id })];
                            }
                        });
                    }); }))];
            case 1:
                roomsWithStripe = _a.sent();
                return [4 /*yield*/, Hotel_1.default.create(__assign(__assign({}, hotelData_1), { rooms: roomsWithStripe }))];
            case 2:
                hotel = _a.sent();
                res.status(201).json(hotel);
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error("Error creating hotel:", error_3);
                next(error_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.createHotel = createHotel;
var deleteHotel = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var hotelId, hotel, activeBookings, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                hotelId = req.params.id;
                return [4 /*yield*/, Hotel_1.default.findById(hotelId)];
            case 1:
                hotel = _a.sent();
                if (!hotel) {
                    throw new not_found_error_1.default("Hotel not found");
                }
                return [4 /*yield*/, Booking_1.default.exists({
                        hotelId: hotelId,
                        status: { $in: ["ongoing", "completed"] },
                    })];
            case 2:
                activeBookings = _a.sent();
                if (activeBookings) {
                    throw new validation_error_1.default("Cannot delete hotel with active or completed bookings");
                }
                return [4 /*yield*/, Hotel_1.default.findByIdAndDelete(hotelId)];
            case 3:
                _a.sent();
                res.status(204).send();
                return [3 /*break*/, 5];
            case 4:
                error_4 = _a.sent();
                next(error_4);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.deleteHotel = deleteHotel;
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
var getTopTrendingHotels = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var trendingHotels, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Booking_1.default.aggregate([
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
                    ])];
            case 1:
                trendingHotels = _a.sent();
                if (!trendingHotels.length) {
                    throw new not_found_error_1.default("No trending hotels found with rating >= 4.0");
                }
                res.status(200).json(trendingHotels);
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                next(error_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getTopTrendingHotels = getTopTrendingHotels;
var getHotelLocations = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var locations, countries, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Hotel_1.default.distinct("location")];
            case 1:
                locations = _a.sent();
                countries = locations
                    .map(function (location) {
                    var parts = location.split(", ");
                    return parts[parts.length - 1];
                })
                    .filter(function (country, index, self) { return country && self.indexOf(country) === index; });
                res.status(200).json(countries);
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                next(error_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getHotelLocations = getHotelLocations;
//# sourceMappingURL=hotel.js.map