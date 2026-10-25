import dotenv from "dotenv";

// Load .env if present
dotenv.config();

/**
 * Validates environment configuration.
 *
 * @param {Record<string, string | undefined>} envObj
 * @returns {Record<string, any>}
 */
export function validateEnv(envObj = process.env) {
  const errors = [];
  const warnings = [];

  const NODE_ENV = envObj.NODE_ENV || "development";
  const isProduction = NODE_ENV === "production";
  const isTest = NODE_ENV === "test";
  const isDevelopment = NODE_ENV === "development";

  const PORT = parseInt(envObj.PORT || "5000", 10);
  if (Number.isNaN(PORT) || PORT <= 0 || PORT > 65535) {
    errors.push("PORT must be a valid port number between 1 and 65535");
  }

  // MongoDB Atlas Validation
  const MONGODB_URI = envObj.MONGODB_URI || "";
  if (!MONGODB_URI) {
    if (isProduction) {
      errors.push(
        "MONGODB_URI is required in production (MongoDB Atlas connection string)",
      );
    } else {
      warnings.push(
        "MONGODB_URI is not set. Database features will be unavailable.",
      );
    }
  } else if (
    !MONGODB_URI.startsWith("mongodb://") &&
    !MONGODB_URI.startsWith("mongodb+srv://")
  ) {
    errors.push("MONGODB_URI must start with mongodb:// or mongodb+srv://");
  }

  // Upstash / Hosted Redis Validation
  const UPSTASH_REDIS_HOST = envObj.UPSTASH_REDIS_HOST || "";
  const UPSTASH_REDIS_PORT = parseInt(envObj.UPSTASH_REDIS_PORT || "6379", 10);
  const UPSTASH_REDIS_PASSWORD = envObj.UPSTASH_REDIS_PASSWORD || "";
  const UPSTASH_REDIS_TLS =
    envObj.UPSTASH_REDIS_TLS !== undefined
      ? envObj.UPSTASH_REDIS_TLS === "true" || envObj.UPSTASH_REDIS_TLS === "1"
      : Boolean(
          UPSTASH_REDIS_HOST && UPSTASH_REDIS_HOST.includes("upstash.io"),
        );

  const REDIS_URL = envObj.REDIS_URL || "";

  const hasUpstashConfig = Boolean(
    UPSTASH_REDIS_HOST && UPSTASH_REDIS_PASSWORD,
  );
  const hasRedisUrl = Boolean(REDIS_URL);
  const isRedisConfigured = hasUpstashConfig || hasRedisUrl;

  if (
    hasRedisUrl &&
    !REDIS_URL.startsWith("redis://") &&
    !REDIS_URL.startsWith("rediss://")
  ) {
    errors.push("REDIS_URL must start with redis:// or rediss://");
  }

  if (!isRedisConfigured) {
    if (isProduction) {
      errors.push(
        "Redis configuration is required in production. Provide either UPSTASH_REDIS_HOST + UPSTASH_REDIS_PASSWORD or REDIS_URL.",
      );
    } else if (!isTest) {
      warnings.push(
        "Upstash Redis is not configured. Cache and queues will report degraded until credentials are set in .env.",
      );
    }
  }

  const CORS_ORIGIN = envObj.CORS_ORIGIN || "http://localhost:5173";
  const LOG_LEVEL = envObj.LOG_LEVEL || "info";

  if (errors.length > 0) {
    const errorMsg = `Environment configuration validation failed:\n - ${errors.join("\n - ")}`;
    throw new Error(errorMsg);
  }

  if (warnings.length > 0 && LOG_LEVEL !== "silent" && !isTest) {
    // eslint-disable-next-line no-console
    console.warn(
      `Environment configuration notice:\n - ${warnings.join("\n - ")}`,
    );
  }

  return Object.freeze({
    NODE_ENV,
    PORT,
    MONGODB_URI,
    redis: Object.freeze({
      host: UPSTASH_REDIS_HOST,
      port: UPSTASH_REDIS_PORT,
      password: UPSTASH_REDIS_PASSWORD,
      tls: UPSTASH_REDIS_TLS,
      url: REDIS_URL,
      isConfigured: isRedisConfigured,
    }),
    CORS_ORIGIN,
    LOG_LEVEL,
    isProduction,
    isTest,
    isDevelopment,
  });
}

// In runtime, validate process.env
let config;
try {
  config = validateEnv(process.env);
} catch (err) {
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(err.message);
  }
  config = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "5000", 10),
    MONGODB_URI: process.env.MONGODB_URI || "",
    redis: {
      host: process.env.UPSTASH_REDIS_HOST || "",
      port: parseInt(process.env.UPSTASH_REDIS_PORT || "6379", 10),
      password: process.env.UPSTASH_REDIS_PASSWORD || "",
      tls: process.env.UPSTASH_REDIS_TLS === "true",
      url: process.env.REDIS_URL || "",
      isConfigured: Boolean(
        process.env.UPSTASH_REDIS_HOST || process.env.REDIS_URL,
      ),
    },
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
    isProduction: process.env.NODE_ENV === "production",
    isTest: process.env.NODE_ENV === "test",
    isDevelopment: (process.env.NODE_ENV || "development") === "development",
  };
}

export const env = config;
