import {z} from 'zod';
export const createBookingDTO = z.object({
    hotelId:z.string(),
    checkIn:z.string(),
    checkOut:z.string(),
    roomNumber:z.number(),

});