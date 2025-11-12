import express from "express";
import { sendBookingReceiptWebhook } from "../application/webhook";

const webhookRouter = express.Router();

webhookRouter.post("/send-booking-receipt", sendBookingReceiptWebhook);

export default webhookRouter;