import { isAuthenticated } from './middleware/authentication-middleware';
import express from "express";
import { getAllHotels,getHotelById,createHotel,deleteHotel,updateHotel } from "../application/hotel";
import { isAdmin } from './middleware/authorization-middleware';

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

export default hotelsRouter;  