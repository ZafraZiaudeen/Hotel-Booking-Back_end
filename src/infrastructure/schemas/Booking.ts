import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
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
        validator: function (value: Date) {
          const today = new Date();
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
        validator: function (value: Date) {
          return value > (this as any).checkIn;
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
          validator: function (value: string[]) {
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
  },
  {
    timestamps: true, 
  }
);

// Indexes for efficient querying
bookingSchema.index({ hotelId: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ "roomAssignments.roomType": 1 });
bookingSchema.index({ status: 1 }); 

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;