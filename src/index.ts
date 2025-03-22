import "dotenv/config";
import express from 'express';
import hotelsRouter from './api/hotel';
import bookingsRouter from "./api/booking";
import connectDB from "./infrastructure/db";
import cors from "cors"
import globalErrorHandlingMinddleware from "./api/middleware/global-error-handling-middleware";
import { clerkMiddleware } from "@clerk/express";

// Create an express application
const app = express();

app.use(clerkMiddleware());
// Middleware to parse the JSON data in the request body
app.use(express.json());
app.use(cors());

connectDB();


app.use("/api/hotels", hotelsRouter);
app.use("/api/bookings",bookingsRouter);

app.use(globalErrorHandlingMinddleware);// this should be placed after all handler function

// Define port to run the server
app.listen(8000, () => {
  console.log('Server is running on http://localhost:8000');
});
  