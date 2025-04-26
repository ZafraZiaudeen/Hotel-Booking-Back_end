"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFavoriteDTO = void 0;
var zod_1 = require("zod");
exports.CreateFavoriteDTO = zod_1.z.object({
    hotelId: zod_1.z.string().refine(function (val) { return /^[0-9a-fA-F]{24}$/.test(val); }, { message: "Invalid hotelId format" }),
});
//# sourceMappingURL=favourite.js.map