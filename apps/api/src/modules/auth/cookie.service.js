import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { getRefreshMaxAgeMs } from "./token.service.js";

export const REFRESH_COOKIE_NAME = "refresh_token";
export const CSRF_COOKIE_NAME = "csrf_token";
export const REFRESH_COOKIE_PATH = "/api/v1/auth";

function baseCookieOptions() {
  const options = {
    secure: Boolean(env.COOKIE_SECURE),
    sameSite: env.COOKIE_SAMESITE || "lax",
    domain: env.COOKIE_DOMAIN || undefined,
  };
  return options;
}

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    httpOnly: true,
    path: REFRESH_COOKIE_PATH,
    maxAge: getRefreshMaxAgeMs(),
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...baseCookieOptions(),
    httpOnly: true,
    path: REFRESH_COOKIE_PATH,
  });
}

export function setCsrfCookie(res) {
  const token = crypto.randomBytes(24).toString("base64url");
  res.cookie(CSRF_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    httpOnly: false,
    path: "/",
    maxAge: getRefreshMaxAgeMs(),
  });
  return token;
}

export function clearCsrfCookie(res) {
  res.clearCookie(CSRF_COOKIE_NAME, {
    ...baseCookieOptions(),
    httpOnly: false,
    path: "/",
  });
}
