import { ERROR_CODES } from "@platform/shared";
import { sendError } from "../utils/response.js";

/**
 * 404 Not Found handler middleware.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function notFoundMiddleware(req, res) {
  sendError(
    res,
    ERROR_CODES.NOT_FOUND,
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
  );
}
