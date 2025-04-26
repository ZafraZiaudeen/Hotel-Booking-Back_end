"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateHotelDTO = exports.RoomDTO = void 0;
var zod_1 = require("zod");
// Room DTO aligned with the updated room schema
exports.RoomDTO = zod_1.z
    .object({
    type: zod_1.z.string().min(1, "Room type is required"),
    from: zod_1.z.number().min(1, "Starting room number must be at least 1"),
    to: zod_1.z.number().min(1, "Ending room number must be at least 1"),
    price: zod_1.z.number().min(1, "Price must be greater than 0"),
})
    .refine(function (data) { return data.to >= data.from; }, {
    message: "Ending room number must be greater than or equal to starting room number",
    path: ["to"],
});
// DTO for creating a hotel
exports.CreateHotelDTO = zod_1.z.object({
    name: zod_1.z.string().min(1, "Hotel name is required"),
    location: zod_1.z.string().min(1, "Location is required"),
    image: zod_1.z.string().min(1, "Image URL is required"),
    description: zod_1.z.string().min(1, "Description is required"),
    rating: zod_1.z.number().min(0, "Rating must be at least 0").max(5, "Rating must be at most 5"),
    reviews: zod_1.z.number().min(0, "Review count must be at least 0"),
    amenities: zod_1.z.array(zod_1.z.string()).min(1, "At least one amenity is required"),
    rooms: zod_1.z.array(exports.RoomDTO).min(1, "At least one room type is required"),
});
//# sourceMappingURL=hotel.js.map