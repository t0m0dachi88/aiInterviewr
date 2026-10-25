import { ERROR_CODES, USER_STATUS } from "@platform/shared";
import { AppError } from "../../middleware/error.middleware.js";
import { env } from "../../config/env.js";
import { User } from "./user.model.js";
import { Session } from "./session.model.js";
import { hashPassword, verifyPassword } from "./password.service.js";
import {
  generateFamilyId,
  generateRefreshToken,
  getAccessTokenExpiresInSeconds,
  hashRefreshToken,
  signAccessToken,
} from "./token.service.js";
import { getRefreshExpiryDate } from "./token.service.js";
import { serializeUser } from "./user.serializer.js";

function requestMeta(req) {
  return {
    userAgent: String(req.get("user-agent") || "").slice(0, 512),
    ipAddress: String(req.ip || req.socket?.remoteAddress || "").slice(0, 64),
  };
}

function unauthorized() {
  return new AppError(
    "Invalid email or password",
    401,
    ERROR_CODES.UNAUTHORIZED,
  );
}

function authRequired() {
  return new AppError("Authentication required", 401, ERROR_CODES.UNAUTHORIZED);
}

async function issueSession(user, req) {
  const refreshToken = generateRefreshToken();
  const session = await Session.create({
    userId: user._id,
    tokenHash: hashRefreshToken(refreshToken),
    familyId: generateFamilyId(),
    expiresAt: getRefreshExpiryDate(),
    ...requestMeta(req),
  });

  const accessToken = signAccessToken({
    userId: user._id,
    sessionId: session._id,
  });

  return {
    user: serializeUser(user),
    accessToken,
    expiresIn: getAccessTokenExpiresInSeconds(),
    refreshToken,
  };
}

export async function registerUser({ displayName, email, password }, req) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(
      "An account with this email already exists",
      409,
      ERROR_CODES.CONFLICT,
    );
  }

  try {
    const user = await User.create({
      displayName,
      email,
      passwordHash: await hashPassword(password),
      status: USER_STATUS.ACTIVE,
    });
    return issueSession(user, req);
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError(
        "An account with this email already exists",
        409,
        ERROR_CODES.CONFLICT,
      );
    }
    throw err;
  }
}

export async function loginUser({ email, password }, req) {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || user.status !== USER_STATUS.ACTIVE) {
    throw unauthorized();
  }

  const matches = await verifyPassword(user.passwordHash, password);
  if (!matches) {
    throw unauthorized();
  }

  return issueSession(user, req);
}

export async function refreshSession(rawRefreshToken, req) {
  if (!rawRefreshToken) {
    throw authRequired();
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);
  const now = new Date();
  const incomingMeta = requestMeta(req);

  const current = await Session.findOneAndUpdate(
    {
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        revokedAt: now,
        lastUsedAt: now,
      },
    },
    { new: false },
  );

  if (!current) {
    const existing = await Session.findOne({ tokenHash });
    if (existing?.revokedAt) {
      const age = now.getTime() - new Date(existing.revokedAt).getTime();
      if (age >= 0 && age <= (env.REFRESH_REUSE_GRACE_MS || 15000)) {
        throw authRequired();
      }
    }
    if (existing) {
      await Session.updateMany(
        { familyId: existing.familyId, revokedAt: null },
        { $set: { revokedAt: now } },
      );
    }
    throw authRequired();
  }

  const refreshToken = generateRefreshToken();
  const nextSession = await Session.create({
    userId: current.userId,
    tokenHash: hashRefreshToken(refreshToken),
    familyId: current.familyId,
    expiresAt: getRefreshExpiryDate(),
    ...incomingMeta,
  });
  current.replacedBySessionId = nextSession._id;
  await current.save();

  const user = await User.findById(current.userId);
  if (!user || user.status !== USER_STATUS.ACTIVE) {
    await Session.updateMany(
      { familyId: current.familyId, revokedAt: null },
      { $set: { revokedAt: now } },
    );
    throw authRequired();
  }

  const accessToken = signAccessToken({
    userId: user._id,
    sessionId: nextSession._id,
  });

  return {
    user: serializeUser(user),
    accessToken,
    expiresIn: getAccessTokenExpiresInSeconds(),
    refreshToken,
  };
}

export async function logoutCurrentSession(rawRefreshToken, sessionId) {
  const now = new Date();
  if (rawRefreshToken) {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    await Session.updateOne(
      { tokenHash, revokedAt: null },
      { $set: { revokedAt: now, lastUsedAt: now } },
    );
  }
  if (sessionId) {
    await Session.updateOne(
      { _id: sessionId, revokedAt: null },
      { $set: { revokedAt: now, lastUsedAt: now } },
    );
  }
}

export async function logoutAllSessions(userId) {
  const now = new Date();
  await Session.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: now } },
  );
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw authRequired();
  }
  return serializeUser(user);
}
