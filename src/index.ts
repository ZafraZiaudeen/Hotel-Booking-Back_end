import "dotenv/config";
import express from 'express';
import hotelsRouter from './api/hotel';
import userRouter from "./api/user";
import bookingsRouter from "./api/booking";
import connectDB from "./infrastructure/db";
import cors from "cors"
import globalErrorHandlingMinddleware from "./api/middleware/global-error-handling-middleware";

// Create an express application
const app = express();

// Middleware to parse the JSON data in the request body
app.use(express.json());
app.use(cors());

connectDB();


app.use("/api/hotels", hotelsRouter);
app.use("/api/users",userRouter);
app.use("/api/bookings",bookingsRouter);

app.use(globalErrorHandlingMinddleware);// this should be placed after all handler function

// Define port to run the server
app.listen(8000, () => {
  console.log('Server is running on http://localhost:8000');
});
  