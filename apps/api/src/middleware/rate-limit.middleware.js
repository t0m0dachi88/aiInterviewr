import rateLimit from "express-rate-limit";
import { ERROR_CODES } from "@platform/shared";
import { env } from "../config/env.js";
import { AppError } from "./error.middleware.js";

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        "Too many authentication attempts. Please try again later.",
        429,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
      ),
    );
  },
});
