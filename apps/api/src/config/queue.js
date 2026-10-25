import { getBullMQConnectionOptions } from "./redis.js";

/**
 * BullMQ Queue Configuration Boundary (API / Producer Plane)
 *
 * Requirements:
 * - apps/api acts exclusively as a Queue PRODUCER (enqueuing code execution jobs).
 * - apps/worker acts as the Queue CONSUMER (consuming and sandboxing execution jobs).
 * - In Phase 0, we define the connection options and queue name boundaries without
 *   implementing execution business logic prematurely.
 */

export const QUEUE_NAMES = Object.freeze({
  CODE_EXECUTION: "code-execution",
});

/**
 * Returns connection options for BullMQ Queue producer instances.
 *
 * @param {Record<string, any>} [customConfig]
 * @returns {import('ioredis').RedisOptions}
 */
export function getQueueConnectionOptions(customConfig) {
  return getBullMQConnectionOptions(customConfig);
}
