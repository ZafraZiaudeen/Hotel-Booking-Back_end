import express from "express";
import { addToFavorites, removeFromFavorites, getUserFavorites } from "../application/favourite";
import { isAuthenticated } from "./middleware/authentication-middleware";

const favoritesRouter = express.Router();

favoritesRouter.post("/", isAuthenticated, addToFavorites);          
favoritesRouter.delete("/:hotelId", isAuthenticated, removeFromFavorites); 
favoritesRouter.get("/", isAuthenticated, getUserFavorites);

export default favoritesRouter;