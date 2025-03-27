import { Request, Response, NextFunction } from "express";
import Favorite from "../infrastructure/schemas/Favourite"; 
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import { CreateFavoriteDTO } from "../domain/dtos/favourite";

// Add a hotel to favorites
export const addToFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const favoriteData = CreateFavoriteDTO.safeParse(req.body);
    if (!favoriteData.success) {
      throw new ValidationError(favoriteData.error.message);
    }
    const { hotelId } = favoriteData.data;

    const userId = req.auth.userId;

    const existingFavorite = await Favorite.findOne({ userId, hotelId });
    if (existingFavorite) {
      res.status(200).json({ message: "Hotel already in favorites" });
      return;
    }

    const favorite = await Favorite.create({ userId, hotelId });
    res.status(201).json(favorite);
    return;
  } catch (error) {
    next(error);
  }
};

// Remove a hotel from favorites
export const removeFromFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = req.params;
    const userId = req.auth.userId;

    const favorite = await Favorite.findOneAndDelete({ userId, hotelId });
    if (!favorite) {
      throw new NotFoundError("Favorite not found");
    }

    res.status(200).json({ message: "Hotel removed from favorites" });
    return;
  } catch (error) {
    next(error);
  }
};

// Get user's favorite hotels
export const getUserFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth.userId;

    const favorites = await Favorite.find({ userId }).populate("hotelId");
    if (!favorites.length) {
      throw new NotFoundError("No favorites found for this user");
    }

    res.status(200).json(favorites.map(fav => fav.hotelId));
    return;
  } catch (error) {
    next(error);
  }
};