"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var express_1 = __importDefault(require("express"));
var hotel_1 = __importDefault(require("./api/hotel"));
var booking_1 = __importDefault(require("./api/booking"));
var db_1 = __importDefault(require("./infrastructure/db"));
var cors_1 = __importDefault(require("cors"));
var global_error_handling_middleware_1 = __importDefault(require("./api/middleware/global-error-handling-middleware"));
var express_2 = require("@clerk/express");
var favorite_1 = __importDefault(require("./api/favorite"));
var booking_2 = require("./application/booking");
var payment_1 = require("./application/payment");
var body_parser_1 = __importDefault(require("body-parser"));
var payment_2 = __importDefault(require("./api/payment"));
var cron = require("node-cron");
// Create an express application
var app = (0, express_1.default)();
app.use((0, express_2.clerkMiddleware)());
// Middleware to parse the JSON data in the request body
app.use((0, cors_1.default)());
console.log("Server starting - Running initial booking status update...");
(0, booking_2.updateBookingStatus)().then(function () {
    console.log("Initial booking status update completed.");
}).catch(function (err) {
    console.error("Error during initial booking status update:", err);
});
app.post("/api/stripe/webhook", body_parser_1.default.raw({ type: "application/json" }), payment_1.handleWebhook);
app.use(express_1.default.json());
app.use("/api/hotels", hotel_1.default);
app.use("/api/bookings", booking_1.default);
app.use("/api/favorites", favorite_1.default);
app.use("/api/payments", payment_2.default);
cron.schedule("0 * * * *", function () {
    console.log("Running scheduled booking status update...");
    (0, booking_2.updateBookingStatus)().then(function () {
        console.log("Scheduled booking status update completed.");
    }).catch(function (err) {
        console.error("Error during scheduled booking status update:", err);
    });
});
app.use(global_error_handling_middleware_1.default); // this should be placed after all handler function
// Define the port to run the server
(0, db_1.default)();
var PORT = process.env.PORT || 8000;
app.listen(PORT, function () { return console.log("Server running on port ".concat(PORT)); });
//# sourceMappingURL=index.js.map