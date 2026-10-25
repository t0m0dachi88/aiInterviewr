import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRedisConnectionOptions,
  getBullMQConnectionOptions,
  connectRedis,
  setRedisClient,
  checkRedisHealth,
} from "../config/redis.js";

describe("Upstash Redis & BullMQ Configuration", () => {
  beforeEach(() => {
    setRedisClient(null);
  });

  it("generates BullMQ-compliant options with null maxRetriesPerRequest and TLS", () => {
    const config = {
      host: "flowing-mammal-12345.upstash.io",
      port: 6379,
      password: "test-password",
      tls: true,
      isConfigured: true,
    };

    const options = getBullMQConnectionOptions(config);

    expect(options.maxRetriesPerRequest).toBeNull(); // Strictly required by BullMQ
    expect(options.enableReadyCheck).toBe(false); // Recommended for Upstash serverless
    expect(options.host).toBe("flowing-mammal-12345.upstash.io");
    expect(options.port).toBe(6379);
    expect(options.password).toBe("test-password");
    expect(options.tls).toEqual({ rejectUnauthorized: true });
  });

  it("generates base Redis options from rediss URL with parsed connection details", () => {
    const options = getRedisConnectionOptions({
      url: "rediss://default:pass@flowing-mammal-12345.upstash.io:6379",
    });
    expect(options.maxRetriesPerRequest).toBeNull();
    expect(options.enableReadyCheck).toBe(false);
    expect(options.host).toBe("flowing-mammal-12345.upstash.io");
    expect(options.port).toBe(6379);
    expect(options.password).toBe("pass");
    expect(options.tls).toEqual({ rejectUnauthorized: true });
  });

  it("supports dependency injection of a mock Redis client for tests", () => {
    const mockClient = {
      status: "ready",
      ping: vi.fn().mockResolvedValue("PONG"),
    };

    const client = connectRedis(mockClient);
    expect(client).toBe(mockClient);
  });

  it("checks Redis health returning healthy when PING succeeds", async () => {
    const mockClient = {
      status: "ready",
      ping: vi.fn().mockResolvedValue("PONG"),
    };
    setRedisClient(mockClient);

    const health = await checkRedisHealth();
    expect(health.status).toBe("healthy");
    expect(typeof health.latencyMs).toBe("number");
  });

  it("checks Redis health returning unhealthy when status is not ready", async () => {
    const mockClient = {
      status: "connecting",
      ping: vi.fn(),
    };
    setRedisClient(mockClient);

    const health = await checkRedisHealth();
    expect(health.status).toBe("unhealthy");
    expect(health.error).toContain("Redis not ready");
  });

  it("handles ping timeout returning unhealthy without hanging", async () => {
    const mockClient = {
      status: "ready",
      // Never resolving ping to simulate network hang
      ping: vi.fn().mockImplementation(() => new Promise(() => {})),
    };
    setRedisClient(mockClient);

    const health = await checkRedisHealth(50);
    expect(health.status).toBe("unhealthy");
    expect(health.error).toContain("Redis ping timed out");
  });
});
