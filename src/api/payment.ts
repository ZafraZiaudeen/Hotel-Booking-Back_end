import express from "express";
import {
  createCheckoutSession,
  handleWebhook,
  retrieveSessionStatus,
} from "../application/payment";
import { isAuthenticated } from "./middleware/authentication-middleware";

const paymentsRouter = express.Router();

// Routes requiring authentication
paymentsRouter.post("/create-checkout-session", isAuthenticated, createCheckoutSession);
paymentsRouter.get("/session-status", isAuthenticated, retrieveSessionStatus);


export default paymentsRouter;