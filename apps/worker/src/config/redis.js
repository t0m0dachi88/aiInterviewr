import { workerEnv } from "./env.js";

/**
 * Returns connection options configured for Upstash Redis with TLS
 * conforming to official BullMQ Worker requirements.
 *
 * @param {Record<string, any>} [customConfig]
 * @returns {import('ioredis').RedisOptions}
 */
export function getWorkerRedisOptions(customConfig) {
  const config = customConfig || workerEnv.redis;

  const baseOptions = {
    maxRetriesPerRequest: null, // Strictly required by BullMQ Worker
    enableReadyCheck: false, // Recommended for Upstash serverless Redis
    lazyConnect: true,
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
      // Fall back if URL parsing fails
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
