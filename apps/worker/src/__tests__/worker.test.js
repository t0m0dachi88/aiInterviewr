import { describe, it, expect } from "vitest";
import { QUEUE_NAMES, getBullMQWorkerOptions } from "../config/queue.js";
import { workerEnv } from "../config/env.js";

describe("Worker Configuration & Boundary", () => {
  it("defines standard queue names", () => {
    expect(QUEUE_NAMES.CODE_EXECUTION).toBe("code-execution");
  });

  it("constructs BullMQ worker options with concurrency", () => {
    const options = getBullMQWorkerOptions({
      host: "localhost",
      port: 6379,
      password: "test-password",
      tls: false,
    });
    expect(options.concurrency).toBe(workerEnv.concurrency);
    expect(options.connection.host).toBe("localhost");
    expect(options.connection.port).toBe(6379);
    expect(options.connection.maxRetriesPerRequest).toBeNull();
  });
});
