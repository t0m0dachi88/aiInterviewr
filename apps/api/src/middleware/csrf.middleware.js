import { ERROR_CODES } from "@platform/shared";
import { env } from "../config/env.js";
import { AppError } from "./error.middleware.js";
import { CSRF_COOKIE_NAME } from "../modules/auth/cookie.service.js";

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }
  const allowed = String(env.CORS_ORIGIN || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}

/**
 * CSRF protection for cookie-authenticated state changes.
 * Requires a matching double-submit csrf_token cookie and X-CSRF-Token header,
 * and rejects disallowed Origin values.
 */
export function csrfProtection(req, _res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.get("origin") || "";
  if (!isAllowedOrigin(origin)) {
    return next(
      new AppError("Invalid request origin", 403, ERROR_CODES.FORBIDDEN),
    );
  }

  const header = req.get("x-csrf-token") || "";
  const cookie = req.cookies?.[CSRF_COOKIE_NAME] || "";
  if (!header || !cookie || header !== cookie) {
    return next(
      new AppError("CSRF validation failed", 403, ERROR_CODES.FORBIDDEN),
    );
  }

  return next();
}
