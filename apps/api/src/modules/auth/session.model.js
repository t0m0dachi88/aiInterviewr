import mongoose from "mongoose";

/**
 * Refresh-token session. Only the token hash is stored — never the plaintext.
 * Collection name: sessions (documented mapping from earlier refreshTokens sketch).
 */
const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    familyId: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedBySessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    userAgent: {
      type: String,
      default: "",
      maxlength: 512,
    },
    ipAddress: {
      type: String,
      default: "",
      maxlength: 64,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

sessionSchema.index({ userId: 1, familyId: 1 });
sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session =
  mongoose.models.Session || mongoose.model("Session", sessionSchema);
