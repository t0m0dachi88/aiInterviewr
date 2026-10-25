import app from "./app.js";
import { env, validateEnv } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/database.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";

let server = null;
let isShuttingDown = false;

/**
 * Graceful shutdown handler.
 *
 * @param {string} signal
 */
export async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  // Force exit after 10 seconds if connections hang during shutdown
  const forceExitTimer = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error("Graceful shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  // eslint-disable-next-line no-console
  console.log(`\nReceived ${signal}. Initiating graceful shutdown...`);

  // Stop accepting new HTTP connections
  if (server) {
    await new Promise((resolve) => {
      server.close(() => {
        // eslint-disable-next-line no-console
        console.log("HTTP server closed.");
        resolve();
      });
    });
  }

  // Close external connections
  try {
    await disconnectRedis();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error closing Redis connection:", err.message);
  }

  try {
    await disconnectDB();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error closing MongoDB connection:", err.message);
  }

  clearTimeout(forceExitTimer);
  // eslint-disable-next-line no-console
  console.log("Graceful shutdown completed.");
  process.exit(0);
}

/**
 * Bootstrap and start the API server.
 */
export async function startServer() {
  try {
    // Validate configuration
    validateEnv(process.env);

    // Connect to MongoDB Atlas (if configured)
    if (env.MONGODB_URI) {
      // eslint-disable-next-line no-console
      console.log("Connecting to MongoDB Atlas...");
      await connectDB();
    } else if (!env.isProduction) {
      // eslint-disable-next-line no-console
      console.warn(
        "Notice: MONGODB_URI is not set. Database features will report disconnected.",
      );
    }

    // Connect to Upstash Redis with TLS (if configured)
    if (env.redis.isConfigured) {
      // eslint-disable-next-line no-console
      console.log("Connecting to Upstash Redis (TLS enabled)...");
      const redis = connectRedis();
      if (redis) {
        await redis.connect();
      }
    } else if (!env.isProduction) {
      // eslint-disable-next-line no-console
      console.warn(
        "Notice: Upstash Redis is not configured. Cache/queue will report disconnected.",
      );
    }

    // Start HTTP listener
    server = app.listen(env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(
        `API server listening on port ${env.PORT} in ${env.NODE_ENV} mode`,
      );
      // eslint-disable-next-line no-console
      console.log(
        `Health endpoint: http://localhost:${env.PORT}/api/v1/health`,
      );
      // eslint-disable-next-line no-console
      console.log(
        `Readiness endpoint: http://localhost:${env.PORT}/api/v1/health/ready`,
      );
    });

    // Listen for system termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    return server;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Fatal error during server startup:", error.message);
    process.exit(1);
  }
}

// Auto-run if executed directly
if (
  process.env.NODE_ENV !== "test" &&
  import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`
) {
  startServer();
}
