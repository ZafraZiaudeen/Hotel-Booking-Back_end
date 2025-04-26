"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var favourite_1 = require("../application/favourite");
var authentication_middleware_1 = require("./middleware/authentication-middleware");
var favoritesRouter = express_1.default.Router();
favoritesRouter.post("/", authentication_middleware_1.isAuthenticated, favourite_1.addToFavorites);
favoritesRouter.delete("/:hotelId", authentication_middleware_1.isAuthenticated, favourite_1.removeFromFavorites);
favoritesRouter.get("/", authentication_middleware_1.isAuthenticated, favourite_1.getUserFavorites);
exports.default = favoritesRouter;
//# sourceMappingURL=favorite.js.map