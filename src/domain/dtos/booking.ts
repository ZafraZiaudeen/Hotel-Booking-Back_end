import { z } from "zod";

export const createBookingDTO = z.object({
  hotelId: z.string(),
  checkIn: z.string().transform((val) => new Date(val)),
  checkOut: z.string().transform((val) => new Date(val)),
  roomSelections: z.array(
    z.object({
      roomType: z.string(),
      numRooms: z.number().int().min(1).max(10),
    })
  ),
  specialRequests: z.string().optional(),
});