import { isAuthenticated } from './middleware/authentication-middleware';
import express from "express";
import { getAllHotels,getHotelById,createHotel,deleteHotel,updateHotel,generateResponse } from "../application/hotel";
import { isAdmin } from './middleware/authorization-middleware';
import { createEmbeddings } from './embedding';
import { retrieve } from '../application/retrieve';

const hotelsRouter = express.Router();

// hotelsRouter.get("/", getAllHotels);
// hotelsRouter.get("/:id", getHotelById);
// hotelsRouter.post("/", createHotel);
// hotelsRouter.delete("/:id", deleteHotel);
// hotelsRouter.put("/:id", updateHotel);

//alternative way to write the above code
hotelsRouter.route("/")
    .get(getAllHotels)
    .post(isAuthenticated,isAdmin,createHotel);

hotelsRouter.route("/:id")
    .get(getHotelById)
    .delete(deleteHotel)
    .put(updateHotel);

hotelsRouter.route("/embeddings/create").post(createEmbeddings);
hotelsRouter.route("/search/retrieve").get(retrieve)

export default hotelsRouter;  