import crypto from "node:crypto";

/**
 * Request ID middleware.
 * Attaches a unique request ID to each incoming request and sets the response header.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers["x-request-id"];
  const requestId =
    typeof incomingId === "string" && incomingId.trim().length > 0
      ? incomingId.trim()
      : `req_${crypto.randomUUID()}`;

  req.id = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
