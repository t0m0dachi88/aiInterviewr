import { Redis } from "ioredis";
import { env } from "./env.js";

let redisClient = null;

/**
 * Returns connection options configured for Upstash Redis with TLS
 * conforming to official BullMQ connection requirements.
 *
 * @param {Record<string, any>} [customConfig]
 * @returns {import('ioredis').RedisOptions}
 */
export function getRedisConnectionOptions(customConfig) {
  const config = customConfig || env.redis;

  // Base options adhering strictly to BullMQ requirements
  const baseOptions = {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false, // Recommended for Upstash serverless Redis
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 10) {
        if (env.LOG_LEVEL !== "silent" && !env.isTest) {
          // eslint-disable-next-line no-console
          console.error("Redis retry limit exceeded.");
        }
        return null;
      }
      return Math.min(times * 200, 3000);
    },
  };

  let host = config.host || "localhost";
  let port = config.port || 6379;
  let password = config.password || undefined;
  let username = undefined;
  let tls = config.tls ? { rejectUnauthorized: true } : undefined;

  if (config.url) {
    try {
      const parsedUrl = new URL(config.url);
      host = parsedUrl.hostname;
      port = parseInt(parsedUrl.port || "6379", 10);
      if (parsedUrl.password) {
        password = decodeURIComponent(parsedUrl.password);
      }
      if (parsedUrl.username && parsedUrl.username !== "default") {
        username = decodeURIComponent(parsedUrl.username);
      }
      if (parsedUrl.protocol === "rediss:") {
        tls = { rejectUnauthorized: true };
      }
    } catch {
      // Fall back to config values if URL parsing fails
    }
  }

  return {
    ...baseOptions,
    host,
    port,
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
    ...(tls ? { tls } : {}),
  };
}

/**
 * Returns connection options specifically for BullMQ Queue instances.
 * In BullMQ, queue producers in apps/api share this connection format.
 *
 * @param {Record<string, any>} [customConfig]
 * @returns {import('ioredis').RedisOptions}
 */
export function getBullMQConnectionOptions(customConfig) {
  return getRedisConnectionOptions(customConfig);
}

/**
 * Initialize and connect Redis client using Upstash credentials.
 * Supports dependency injection of an existing client or custom options for automated testing.
 *
 * @param {Redis | Record<string, any>} [clientOrOptions]
 * @returns {Redis | null}
 */
export function connectRedis(clientOrOptions) {
  // Dependency injection: allow passing an already instantiated Redis client or mock
  if (clientOrOptions && typeof clientOrOptions.ping === "function") {
    redisClient = clientOrOptions;
    return redisClient;
  }

  if (redisClient) {
    return redisClient;
  }

  const options = getRedisConnectionOptions(clientOrOptions);
  const config = clientOrOptions || env.redis;

  // If Redis is not configured in local development, avoid crashing startup
  if (!config.isConfigured && !config.host && !config.url && !env.isTest) {
    if (env.LOG_LEVEL !== "silent") {
      // eslint-disable-next-line no-console
      console.warn(
        "Upstash Redis is unconfigured. Redis features will report degraded.",
      );
    }
    return null;
  }

  if (config.url) {
    redisClient = new Redis(config.url, options);
  } else {
    redisClient = new Redis(options);
  }

  redisClient.on("connect", () => {
    if (env.LOG_LEVEL !== "silent" && !env.isTest) {
      // eslint-disable-next-line no-console
      console.log("Connected to Upstash Redis (TLS enabled).");
    }
  });

  redisClient.on("ready", () => {
    if (env.LOG_LEVEL !== "silent" && !env.isTest) {
      // eslint-disable-next-line no-console
      console.log("Upstash Redis client ready for commands and BullMQ.");
    }
  });

  redisClient.on("error", (err) => {
    if (env.LOG_LEVEL !== "silent" && !env.isTest) {
      // eslint-disable-next-line no-console
      console.error("Upstash Redis connection error:", err.message);
    }
  });

  return redisClient;
}

/**
 * Get current Redis client instance.
 *
 * @returns {Redis | null}
 */
export function getRedisClient() {
  return redisClient;
}

/**
 * Set the Redis client instance directly (useful for testing & dependency injection).
 *
 * @param {Redis | null} client
 */
export function setRedisClient(client) {
  redisClient = client;
}

/**
 * Disconnect Redis client gracefully.
 *
 * @returns {Promise<void>}
 */
export async function disconnectRedis() {
  if (redisClient) {
    try {
      if (redisClient.status !== "end") {
        await redisClient.quit();
      }
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
    }
  }
}

/**
 * Returns true if Redis is ready for commands.
 *
 * @returns {boolean}
 */
export function isRedisReady() {
  return redisClient ? redisClient.status === "ready" : false;
}

/**
 * Check Upstash Redis health via PING command.
 *
 * @returns {Promise<{ status: 'healthy' | 'unhealthy' | 'unconfigured', latencyMs?: number, error?: string }>}
 */
export async function checkRedisHealth(timeoutMs = 2500) {
  if (!env.redis.isConfigured && !redisClient) {
    return {
      status: "unconfigured",
      error: "Upstash Redis is not configured in .env",
    };
  }

  if (!redisClient || redisClient.status !== "ready") {
    return {
      status: "unhealthy",
      error: `Redis not ready (status: ${redisClient ? redisClient.status : "uninitialized"})`,
    };
  }

  const start = Date.now();
  try {
    let timerId;
    const timeoutPromise = new Promise((_, reject) => {
      timerId = setTimeout(
        () => reject(new Error(`Redis ping timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
    });

    const pong = await Promise.race([
      redisClient.ping().finally(() => clearTimeout(timerId)),
      timeoutPromise,
    ]);

    const latencyMs = Date.now() - start;
    if (pong === "PONG") {
      return { status: "healthy", latencyMs };
    }
    return { status: "unhealthy", error: `Unexpected PING response: ${pong}` };
  } catch (err) {
    return { status: "unhealthy", error: err.message };
  }
}
