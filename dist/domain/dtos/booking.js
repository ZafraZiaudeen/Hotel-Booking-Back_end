"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBookingDTO = void 0;
var zod_1 = require("zod");
exports.createBookingDTO = zod_1.z.object({
    hotelId: zod_1.z.string(),
    checkIn: zod_1.z.string().transform(function (val) { return new Date(val); }),
    checkOut: zod_1.z.string().transform(function (val) { return new Date(val); }),
    roomSelections: zod_1.z.array(zod_1.z.object({
        roomType: zod_1.z.string(),
        numRooms: zod_1.z.number().int().min(1).max(10),
    })),
    specialRequests: zod_1.z.string().optional(),
});
//# sourceMappingURL=booking.js.map