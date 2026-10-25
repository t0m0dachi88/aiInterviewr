import { ERROR_CODES, USER_STATUS } from "@platform/shared";
import { AppError } from "./error.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../modules/auth/user.model.js";
import { Session } from "../modules/auth/session.model.js";
import { verifyAccessToken } from "../modules/auth/token.service.js";

function extractBearerToken(req) {
  const header = req.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * Require a valid access token bound to an active, non-revoked session.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    throw new AppError(
      "Authentication required",
      401,
      ERROR_CODES.UNAUTHORIZED,
    );
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError(
      "Authentication required",
      401,
      ERROR_CODES.UNAUTHORIZED,
    );
  }

  const userId = payload.sub;
  const sessionId = payload.sid;
  if (!userId || !sessionId) {
    throw new AppError(
      "Authentication required",
      401,
      ERROR_CODES.UNAUTHORIZED,
    );
  }

  const [user, session] = await Promise.all([
    User.findById(userId),
    Session.findById(sessionId),
  ]);

  if (!user || user.status !== USER_STATUS.ACTIVE) {
    throw new AppError(
      "Authentication required",
      401,
      ERROR_CODES.UNAUTHORIZED,
    );
  }

  if (
    !session ||
    String(session.userId) !== String(user._id) ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now()
  ) {
    throw new AppError(
      "Authentication required",
      401,
      ERROR_CODES.UNAUTHORIZED,
    );
  }

  req.user = {
    id: String(user._id),
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    sessionId: String(session._id),
  };
  req.authUser = user;
  req.authSession = session;
  next();
});
