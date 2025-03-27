import mongoose, { Schema } from "mongoose";

const FavoriteSchema = new Schema({
  userId: { type: String, required: true }, 
  hotelId: { type: Schema.Types.ObjectId, ref: "Hotel", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Favorite", FavoriteSchema);