import mongoose from "mongoose";
import { env } from "./env.js";

let isConnectedBefore = false;

/**
 * Connect to MongoDB Atlas using Mongoose.
 *
 * @param {string} [customUri]
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDB(customUri) {
  const uri = customUri || env.MONGODB_URI;

  if (!uri) {
    throw new Error("MongoDB connection URI is not configured.");
  }

  // Set mongoose options
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    isConnectedBefore = true;
    if (env.LOG_LEVEL !== "silent" && !env.isTest) {
      // eslint-disable-next-line no-console
      console.log("MongoDB connection established successfully.");
    }
  });

  mongoose.connection.on("error", (err) => {
    if (env.LOG_LEVEL !== "silent" && !env.isTest) {
      // eslint-disable-next-line no-console
      console.error("MongoDB connection error:", err.message);
    }
  });

  mongoose.connection.on("disconnected", () => {
    if (env.LOG_LEVEL !== "silent" && !env.isTest && isConnectedBefore) {
      // eslint-disable-next-line no-console
      console.warn("MongoDB connection lost. Reconnecting...");
    }
  });

  return mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
}

/**
 * Disconnect from MongoDB gracefully.
 *
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    if (env.LOG_LEVEL !== "silent" && !env.isTest) {
      // eslint-disable-next-line no-console
      console.log("MongoDB disconnected.");
    }
  }
}

/**
 * Returns true if MongoDB connection is open and ready.
 * readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 *
 * @returns {boolean}
 */
export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Get detailed MongoDB health status.
 *
 * @returns {{ status: 'connected' | 'connecting' | 'disconnected' | 'disconnecting', readyState: number }}
 */
export function getDbStatus() {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const stateCode = mongoose.connection.readyState;
  return {
    status: states[stateCode] || "disconnected",
    readyState: stateCode,
  };
}
