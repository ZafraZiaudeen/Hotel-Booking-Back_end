"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var authentication_middleware_1 = require("./middleware/authentication-middleware");
var express_1 = __importDefault(require("express"));
var booking_1 = require("../application/booking");
var hotel_1 = require("../application/hotel");
var authorization_middleware_1 = require("./middleware/authorization-middleware");
var embedding_1 = require("./embedding");
var retrieve_1 = require("../application/retrieve");
var hotelsRouter = express_1.default.Router();
// hotelsRouter.get("/", getAllHotels);
// hotelsRouter.get("/:id", getHotelById);
// hotelsRouter.post("/", createHotel);
// hotelsRouter.delete("/:id", deleteHotel);
// hotelsRouter.put("/:id", updateHotel);
//alternative way to write the above code
hotelsRouter.route("/")
    .get(hotel_1.getAllHotels)
    .post(authentication_middleware_1.isAuthenticated, authorization_middleware_1.isAdmin, hotel_1.createHotel);
hotelsRouter.route("/top-trending")
    .get(hotel_1.getTopTrendingHotels);
hotelsRouter.route("/locations")
    .get(hotel_1.getHotelLocations);
hotelsRouter.route("/:id")
    .get(hotel_1.getHotelById)
    .delete(authentication_middleware_1.isAuthenticated, authorization_middleware_1.isAdmin, hotel_1.deleteHotel);
// .put(isAuthenticated,isAdmin,updateHotel);
hotelsRouter.route("/embeddings/create").post(embedding_1.createEmbeddings);
hotelsRouter.route("/search/retrieve").get(retrieve_1.retrieve);
hotelsRouter.route("/:hotelId/availability")
    .get(booking_1.getRoomAvailability);
exports.default = hotelsRouter;
//# sourceMappingURL=hotel.js.map