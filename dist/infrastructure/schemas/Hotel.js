"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var roomSchema = new mongoose_1.default.Schema({
    type: {
        type: String,
        required: [true, "Room type is required"],
        minlength: [1, "Room type must be at least 1 character"],
    },
    from: {
        type: Number,
        required: [true, "Starting room number is required"],
        min: [1, "Starting room number must be at least 1"],
    },
    to: {
        type: Number,
        required: [true, "Ending room number is required"],
        min: [1, "Ending room number must be at least 1"],
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [1, "Price must be greater than 0"],
    },
    stripePriceId: {
        type: String,
        required: [true, "Stripe Price ID is required for each room type"],
    },
});
roomSchema.pre("save", function (next) {
    if (this.to < this.from) {
        return next(new Error("Ending room number must be greater than or equal to starting room number"));
    }
    next();
});
var hotelSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Hotel name is required"],
        minlength: [1, "Hotel name must be at least 1 character"],
    },
    location: {
        type: String,
        required: [true, "Location is required"],
        minlength: [1, "Location must be at least 1 character"],
    },
    image: {
        type: String,
        required: [true, "Image URL is required"],
        minlength: [1, "Image URL must be at least 1 character"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        minlength: [1, "Description must be at least 1 character"],
    },
    rating: {
        type: Number,
        required: [true, "Rating is required"],
        min: [0, "Rating must be at least 0"],
        max: [5, "Rating must be at most 5"],
    },
    reviews: {
        type: Number,
        required: [true, "Review count is required"],
        min: [0, "Review count must be at least 0"],
    },
    amenities: {
        type: [String],
        required: [true, "At least one amenity is required"],
        validate: {
            validator: function (array) { return array.length > 0; },
            message: "At least one amenity is required",
        },
    },
    rooms: {
        type: [roomSchema],
        required: [true, "At least one room type is required"],
        validate: {
            validator: function (array) { return array.length > 0; },
            message: "At least one room type is required",
        },
    },
});
hotelSchema.index({ location: 1 });
hotelSchema.index({ "rooms.price": 1 });
var Hotel = mongoose_1.default.model("Hotel", hotelSchema);
exports.default = Hotel;
//# sourceMappingURL=Hotel.js.map