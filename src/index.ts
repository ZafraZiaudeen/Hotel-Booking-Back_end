import "dotenv/config";
import express from 'express';
import hotelsRouter from './api/hotel';
import bookingsRouter from "./api/booking";
import connectDB from "./infrastructure/db";
import cors from "cors"
import globalErrorHandlingMinddleware from "./api/middleware/global-error-handling-middleware";
import { clerkMiddleware } from "@clerk/express";
import favoritesRouter from "./api/favorite";
import { updateBookingStatus } from "./application/booking";

const cron = require("node-cron");

// Create an express application
const app = express();

app.use(clerkMiddleware());
// Middleware to parse the JSON data in the request body
app.use(express.json());
app.use(cors({ origin: "https://aidf-horizone-frontend-zafra.netlify.app"}));


console.log("Server starting - Running initial booking status update...");
updateBookingStatus().then(() => {
  console.log("Initial booking status update completed.");
}).catch((err) => {
  console.error("Error during initial booking status update:", err);
});

app.use("/api/hotels", hotelsRouter);
app.use("/api/bookings",bookingsRouter);
app.use("/api/favorites",favoritesRouter);

cron.schedule("0 * * * *", () => {
  console.log("Running scheduled booking status update...");
  updateBookingStatus().then(() => {
    console.log("Scheduled booking status update completed.");
  }).catch((err) => {
    console.error("Error during scheduled booking status update:", err);
  });
});

app.use(globalErrorHandlingMinddleware);// this should be placed after all handler function

// Define the port to run the server
connectDB();
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));