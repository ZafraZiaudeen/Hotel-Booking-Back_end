"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
var forbidden_error_1 = __importDefault(require("../../domain/errors/forbidden-error"));
var isAdmin = function (req, res, next) {
    var _a, _b;
    if (!(((_b = (_a = req === null || req === void 0 ? void 0 : req.auth) === null || _a === void 0 ? void 0 : _a.sessionClaims) === null || _b === void 0 ? void 0 : _b.role) !== "admin")) {
        throw new forbidden_error_1.default("Forbidden");
    }
    next();
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=authorization-middleware.js.map