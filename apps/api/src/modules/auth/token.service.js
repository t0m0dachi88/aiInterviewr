import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

const DEV_FALLBACK_SECRET = "dev-insecure-jwt-access-secret-change-me";

/**
 * Signing secret for access tokens.
 *
 * @returns {string}
 */
export function getAccessSecret() {
  if (env.JWT_ACCESS_SECRET && env.JWT_ACCESS_SECRET.length >= 16) {
    return env.JWT_ACCESS_SECRET;
  }
  if (env.isProduction) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }
  return DEV_FALLBACK_SECRET;
}

function getRefreshPepper() {
  return env.REFRESH_TOKEN_PEPPER || getAccessSecret();
}

/**
 * Issue a short-lived JWT access token with minimal claims.
 *
 * @param {{ userId: string, sessionId: string }} params
 * @returns {string}
 */
export function signAccessToken({ userId, sessionId }) {
  return jwt.sign({ sid: String(sessionId) }, getAccessSecret(), {
    algorithm: "HS256",
    subject: String(userId),
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

/**
 * Verify an access token including issuer and audience.
 *
 * @param {string} token
 * @returns {jwt.JwtPayload}
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, getAccessSecret(), {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
}

/**
 * Parse JWT_ACCESS_EXPIRES_IN into seconds for API responses.
 *
 * @returns {number}
 */
export function getAccessTokenExpiresInSeconds() {
  const raw = env.JWT_ACCESS_EXPIRES_IN || "15m";
  const match = /^(\d+)([smhd])$/.exec(String(raw).trim());
  if (!match) {
    return 15 * 60;
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] || 60);
}

export function generateRefreshToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashRefreshToken(token) {
  return crypto
    .createHmac("sha256", getRefreshPepper())
    .update(token)
    .digest("hex");
}

export function generateFamilyId() {
  return crypto.randomUUID();
}

export function generateInvitationToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashInvitationToken(token) {
  return crypto
    .createHmac("sha256", getRefreshPepper())
    .update(`invitation:${token}`)
    .digest("hex");
}

export function generateCandidateToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashCandidateToken(token) {
  return crypto
    .createHmac("sha256", getRefreshPepper())
    .update(`candidate:${token}`)
    .digest("hex");
}

export function getRefreshExpiryDate() {
  const days = Number.isFinite(env.REFRESH_TOKEN_EXPIRES_DAYS)
    ? env.REFRESH_TOKEN_EXPIRES_DAYS
    : 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function getRefreshMaxAgeMs() {
  const days = Number.isFinite(env.REFRESH_TOKEN_EXPIRES_DAYS)
    ? env.REFRESH_TOKEN_EXPIRES_DAYS
    : 30;
  return days * 24 * 60 * 60 * 1000;
}
