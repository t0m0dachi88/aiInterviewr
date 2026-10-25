import { ERROR_CODES } from "@platform/shared";
import { sendError } from "../utils/response.js";
import { env } from "../config/env.js";

/**
 * Custom application error with HTTP status and machine-readable code.
 */
export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code=ERROR_CODES.INTERNAL_ERROR] - Machine-readable error code
   * @param {Record<string, any>} [details] - Optional context or validation details
   */
  constructor(
    message,
    statusCode = 500,
    code = ERROR_CODES.INTERNAL_ERROR,
    details = undefined,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized Express error-handling middleware.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError
    ? err.statusCode
    : err.statusCode || err.status || 500;
  const code = isAppError ? err.code : err.code || ERROR_CODES.INTERNAL_ERROR;
  const message =
    isAppError || env.isDevelopment || env.isTest
      ? err.message
      : "An unexpected internal error occurred";
  const details = isAppError ? err.details : undefined;

  // Log error with request tracking ID (suppressed in silent test mode)
  if (env.LOG_LEVEL !== "silent" && (!env.isTest || statusCode >= 500)) {
    // eslint-disable-next-line no-console
    console.error(
      `[Error] [${req.id || "no-req-id"}] ${req.method} ${req.originalUrl}:`,
      {
        code,
        message: err.message,
        statusCode,
        stack: env.isProduction ? undefined : err.stack,
      },
    );
  }

  return sendError(res, code, message, statusCode, details);
}
