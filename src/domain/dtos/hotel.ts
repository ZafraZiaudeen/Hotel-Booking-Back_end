import { z } from "zod";

// Room DTO aligned with the form's room schema
export const RoomDTO = z
  .object({
    type: z.string().min(1, "Room type is required"),
    from: z.number().min(1, "Starting room number must be at least 1"),
    to: z.number().min(1, "Ending room number must be at least 1"),
    price: z.number().min(1, "Price must be greater than 0"),
  })
  .refine((data) => data.to >= data.from, {
    message: "Ending room number must be greater than or equal to starting room number",
    path: ["to"],
  });

// DTO => Data Transfer Object
export const CreateHotelDTO = z.object({
  name: z.string().min(1, "Hotel name is required"),
  location: z.string().min(1, "Location is required"),
  image: z.string().min(1, "Image URL is required"),
  description: z.string().min(1, "Description is required"),
  rating: z.number().min(0, "Rating must be at least 0").max(5, "Rating must be at most 5"),
  reviews: z.number().min(0, "Review count must be at least 0"),
  amenities: z.array(z.string()).min(1, "At least one amenity is required"),
  rooms: z.array(RoomDTO).min(1, "At least one room type is required"),
});