import { EXECUTION_STATUS, SUPPORTED_LANGUAGES } from "@platform/shared";
import { workerEnv } from "./config/env.js";
import { QUEUE_NAMES, getBullMQWorkerOptions } from "./config/queue.js";

/**
 * Code Execution Worker Service (Standalone Long-Running Process)
 *
 * Architectural Boundary:
 * - Queue Consumer Plane: Listens to Upstash Redis for BullMQ execution jobs.
 * - Concurrency & Limits: Designed for dedicated compute instances outside the API process.
 * - Phase 0 Status: Architectural boundary established. No arbitrary code execution or
 *   Docker socket attachment in Phase 0.
 */

let isRunning = false;
let heartbeatInterval = null;

export function startWorker() {
  isRunning = true;

  // eslint-disable-next-line no-console
  console.log("====================================================");
  // eslint-disable-next-line no-console
  console.log("[Worker Service] Code Execution Worker Initialized");
  // eslint-disable-next-line no-console
  console.log(`[Worker Service] Environment: ${workerEnv.NODE_ENV}`);
  // eslint-disable-next-line no-console
  console.log(`[Worker Service] Queue Consumer: ${QUEUE_NAMES.CODE_EXECUTION}`);
  // eslint-disable-next-line no-console
  console.log(`[Worker Service] Concurrency: ${workerEnv.concurrency}`);
  // eslint-disable-next-line no-console
  console.log(
    `[Worker Service] Upstash Redis Status: ${
      workerEnv.redis.isConfigured
        ? "Configured (TLS enabled)"
        : "Pending .env configuration"
    }`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `[Worker Service] Planned Language Runtimes: ${SUPPORTED_LANGUAGES.join(", ")}`,
  );
  // eslint-disable-next-line no-console
  console.log("====================================================");

  const workerOptions = getBullMQWorkerOptions();

  // Long-running process heartbeat
  heartbeatInterval = setInterval(() => {
    // Keep alive as standalone background daemon
  }, 1000 * 60);

  return {
    isRunning,
    queue: QUEUE_NAMES.CODE_EXECUTION,
    workerOptions,
    supportedLanguages: SUPPORTED_LANGUAGES,
    executionStatuses: Object.values(EXECUTION_STATUS),
  };
}

export function stopWorker() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  isRunning = false;
  // eslint-disable-next-line no-console
  console.log("[Worker Service] Graceful shutdown completed.");
}

// Graceful termination handling for containerized / standalone deployment
process.on("SIGTERM", () => {
  // eslint-disable-next-line no-console
  console.log("[Worker Service] SIGTERM received. Shutting down worker...");
  stopWorker();
  process.exit(0);
});

process.on("SIGINT", () => {
  // eslint-disable-next-line no-console
  console.log("[Worker Service] SIGINT received. Shutting down worker...");
  stopWorker();
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  // eslint-disable-next-line no-console
  console.error("[Worker Service] Uncaught exception:", err.message);
  stopWorker();
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error("[Worker Service] Unhandled rejection:", reason);
});

// Start worker service
if (process.env.NODE_ENV !== "test") {
  startWorker();
}
