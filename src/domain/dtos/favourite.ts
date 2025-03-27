import { z } from "zod";

export const CreateFavoriteDTO = z.object({
  hotelId: z.string().refine(
    (val) => /^[0-9a-fA-F]{24}$/.test(val),
    { message: "Invalid hotelId format" }
  ),
});