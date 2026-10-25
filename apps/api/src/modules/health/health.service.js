import { getDbStatus, isDbConnected } from "../../config/database.js";
import { checkRedisHealth, isRedisReady } from "../../config/redis.js";

const SERVICE_NAME = "@platform/api";
const VERSION = "0.1.0";

/**
 * Health service handling application liveness and dependency readiness.
 */
export class HealthService {
  /**
   * Return basic liveness status.
   */
  static getLiveness() {
    return {
      status: "ok",
      service: SERVICE_NAME,
      version: VERSION,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check dependency readiness (MongoDB Atlas & Redis).
   */
  static async getReadiness() {
    // Check MongoDB Atlas status
    const dbStatus = getDbStatus();
    const dbConnected = isDbConnected();

    // Check Redis status
    const redisHealth = await checkRedisHealth();
    const redisConnected = isRedisReady();

    const isReady = dbConnected && redisConnected;

    return {
      isReady,
      status: isReady ? "ready" : "degraded",
      service: SERVICE_NAME,
      version: VERSION,
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          type: "mongodb-atlas",
          status: dbStatus.status,
          connected: dbConnected,
        },
        redis: {
          type: "upstash-redis",
          status: redisHealth.status,
          connected: redisConnected,
          latencyMs: redisHealth.latencyMs,
          error: redisHealth.error,
        },
      },
    };
  }
}
