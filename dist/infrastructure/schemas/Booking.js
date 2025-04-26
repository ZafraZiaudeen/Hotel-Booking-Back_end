"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var bookingSchema = new mongoose_1.default.Schema({
    hotelId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Hotel",
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    checkIn: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                var today = new Date();
                today.setHours(0, 0, 0, 0);
                return value >= today;
            },
            message: "Check-in date must be today or in the future",
        },
    },
    checkOut: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value > this.checkIn;
            },
            message: "Check-out date must be after check-in date",
        },
    },
    roomAssignments: [{
            roomType: {
                type: String,
                required: true,
            },
            roomNumbers: {
                type: [String],
                required: true,
                validate: {
                    validator: function (value) {
                        return value.length > 0;
                    },
                    message: "At least one room number is required for each room type",
                },
            },
        }],
    specialRequests: {
        type: String,
        required: false,
        default: "",
    },
    status: {
        type: String,
        enum: ["ongoing", "completed", "cancelled"],
        default: "ongoing",
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ["PENDING", "PAID"],
        default: "PENDING",
    },
    paymentMethod: {
        type: String,
        enum: ["CARD", "BANK_TRANSFER"],
        default: "CARD",
    },
}, {
    timestamps: true,
});
// Indexes for efficient querying
bookingSchema.index({ hotelId: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ "roomAssignments.roomType": 1 });
bookingSchema.index({ status: 1 });
var Booking = mongoose_1.default.model("Booking", bookingSchema);
exports.default = Booking;
//# sourceMappingURL=Booking.js.map