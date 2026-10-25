import { getWorkerRedisOptions } from "./redis.js";
import { workerEnv } from "./env.js";

/**
 * BullMQ Consumer Configuration Boundary (Worker Plane)
 *
 * Requirements:
 * - apps/worker acts exclusively as the Queue CONSUMER.
 * - In Phase 0, establishes connection options and worker boundary without
 *   implementing arbitrary code execution prematurely.
 */

export const QUEUE_NAMES = Object.freeze({
  CODE_EXECUTION: "code-execution",
});

/**
 * Returns options for initializing BullMQ Worker instances.
 *
 * @param {Record<string, any>} [customConfig]
 */
export function getBullMQWorkerOptions(customConfig) {
  return {
    connection: getWorkerRedisOptions(customConfig),
    concurrency: workerEnv.concurrency,
  };
}
