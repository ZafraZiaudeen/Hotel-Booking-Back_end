"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var payment_1 = require("../application/payment");
var authentication_middleware_1 = require("./middleware/authentication-middleware");
var paymentsRouter = express_1.default.Router();
// Routes requiring authentication
paymentsRouter.post("/create-checkout-session", authentication_middleware_1.isAuthenticated, payment_1.createCheckoutSession);
paymentsRouter.get("/session-status", authentication_middleware_1.isAuthenticated, payment_1.retrieveSessionStatus);
exports.default = paymentsRouter;
//# sourceMappingURL=payment.js.map