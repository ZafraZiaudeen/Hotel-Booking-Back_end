"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmbeddings = void 0;
var mongodb_1 = require("@langchain/mongodb");
var openai_1 = require("@langchain/openai");
var documents_1 = require("@langchain/core/documents");
var mongoose_1 = __importDefault(require("mongoose"));
var Hotel_1 = __importDefault(require("../infrastructure/schemas/Hotel"));
var createEmbeddings = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, budget_1, _b, pricePreference_1, embeddingModel, vectorIndex, hotels_1, docs, existingIds_1, _c, newDocs, error_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 4, , 5]);
                _a = req.body || {}, budget_1 = _a.budget, _b = _a.pricePreference, pricePreference_1 = _b === void 0 ? "average" : _b;
                embeddingModel = new openai_1.OpenAIEmbeddings({
                    model: "text-embedding-ada-002",
                    apiKey: process.env.OPENAI_API_KEY,
                });
                vectorIndex = new mongodb_1.MongoDBAtlasVectorSearch(embeddingModel, {
                    collection: mongoose_1.default.connection.collection("hotelVectors"),
                    indexName: "vector_index",
                });
                return [4 /*yield*/, Hotel_1.default.find({})];
            case 1:
                hotels_1 = _d.sent();
                if (!hotels_1.length) {
                    res.status(200).json({ message: "No hotels found to embed" });
                    return [2 /*return*/];
                }
                docs = hotels_1.map(function (hotel) {
                    var _id = hotel._id, location = hotel.location, description = hotel.description, rooms = hotel.rooms;
                    // Calculate price based on user preference
                    var priceText;
                    if (rooms.length === 0) {
                        priceText = "Price unavailable";
                    }
                    else {
                        var prices = rooms.map(function (room) { return room.price; });
                        switch (pricePreference_1) {
                            case "lowest":
                                var lowestPrice = Math.min.apply(Math, prices);
                                priceText = "Lowest price per night: $".concat(lowestPrice.toFixed(2));
                                break;
                            case "suggest":
                                if (budget_1 !== undefined) {
                                    var affordablePrices = prices.filter(function (p) { return p <= budget_1; });
                                    var suggestedPrice = affordablePrices.length > 0
                                        ? Math.min.apply(Math, affordablePrices) : Math.min.apply(Math, prices);
                                    priceText = affordablePrices.length > 0
                                        ? "Suggested price within $".concat(budget_1, ": $").concat(suggestedPrice.toFixed(2))
                                        : "No rooms within $".concat(budget_1, ", lowest available: $").concat(suggestedPrice.toFixed(2));
                                }
                                else {
                                    var avgPrice = prices.reduce(function (sum, p) { return sum + p; }, 0) / prices.length;
                                    priceText = "Average price per night: $".concat(avgPrice.toFixed(2));
                                }
                                break;
                            case "average":
                            default:
                                var averagePrice = prices.reduce(function (sum, p) { return sum + p; }, 0) / prices.length;
                                priceText = "Average price per night: $".concat(averagePrice.toFixed(2));
                                break;
                        }
                    }
                    var pageContent = "".concat(description, " Located in ").concat(location, ". ").concat(priceText);
                    return new documents_1.Document({
                        pageContent: pageContent,
                        metadata: { _id: _id.toString() },
                    });
                });
                _c = Set.bind;
                return [4 /*yield*/, mongoose_1.default.connection.collection("hotelVectors").distinct("_id")];
            case 2:
                existingIds_1 = new (_c.apply(Set, [void 0, (_d.sent()).map(function (id) { return id.toString(); })]))();
                newDocs = docs.filter(function (doc) { return !existingIds_1.has(doc.metadata._id); });
                if (newDocs.length === 0) {
                    res.status(200).json({ message: "All hotels already embedded" });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, vectorIndex.addDocuments(newDocs)];
            case 3:
                _d.sent();
                res.status(200).json({
                    message: "Embeddings created for ".concat(newDocs.length, " new hotels"),
                    embeddedCount: newDocs.length,
                });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _d.sent();
                console.error("Error creating embeddings:", error_1);
                next(error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.createEmbeddings = createEmbeddings;
//# sourceMappingURL=embedding.js.map