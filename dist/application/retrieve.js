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
exports.retrieve = void 0;
var Hotel_1 = __importDefault(require("../infrastructure/schemas/Hotel"));
var openai_1 = require("@langchain/openai");
var mongodb_1 = require("@langchain/mongodb");
var mongoose_1 = __importDefault(require("mongoose"));
var retrieve = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var query, hotels_1, embeddingModel, vectorIndex, results, matchedHotels, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                query = req.query.query;
                if (!(!query || query === "")) return [3 /*break*/, 2];
                return [4 /*yield*/, Hotel_1.default.find()];
            case 1:
                hotels_1 = (_a.sent()).map(function (hotel) { return ({
                    hotel: hotel,
                    confidence: 1, //what is confidence? confidence is a measure of how sure we are that the hotel is relevant to the query
                }); });
                res.status(200).json(hotels_1);
                return [2 /*return*/];
            case 2:
                embeddingModel = new openai_1.OpenAIEmbeddings({
                    model: "text-embedding-ada-002",
                    apiKey: process.env.OPENAI_API_KEY
                });
                vectorIndex = new mongodb_1.MongoDBAtlasVectorSearch(embeddingModel, {
                    collection: mongoose_1.default.connection.collection("hotelVectors"),
                    indexName: "vector_index",
                });
                return [4 /*yield*/, vectorIndex.similaritySearchWithScore(query)];
            case 3:
                results = _a.sent();
                console.log(results);
                return [4 /*yield*/, Promise.all(//Promise.all is used to wait for all promises to resolve
                    results.map(function (result) { return __awaiter(void 0, void 0, void 0, function () {
                        var hotel;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, Hotel_1.default.findById(result[0].metadata._id)];
                                case 1:
                                    hotel = _a.sent();
                                    return [2 /*return*/, {
                                            hotel: hotel,
                                            confidence: result[1],
                                        }];
                            }
                        });
                    }); }))];
            case 4:
                matchedHotels = _a.sent();
                res.status(200).json(matchedHotels.filter(function (hotel) { return hotel.confidence > 0.92; }));
                return [2 /*return*/];
            case 5:
                error_1 = _a.sent();
                next(error_1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.retrieve = retrieve;
//# sourceMappingURL=retrieve.js.map