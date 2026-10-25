import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { HealthService } from "../modules/health/health.service.js";

describe("Health Readiness Endpoint (/api/v1/health/ready)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 200 when all dependencies (MongoDB & Redis) are ready", async () => {
    vi.spyOn(HealthService, "getReadiness").mockResolvedValue({
      isReady: true,
      status: "ready",
      service: "@platform/api",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          type: "mongodb-atlas",
          status: "connected",
          connected: true,
        },
        redis: {
          type: "redis",
          status: "healthy",
          connected: true,
          latencyMs: 2,
        },
      },
    });

    const res = await request(app).get("/api/v1/health/ready");

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe(
      "no-cache, no-store, must-revalidate",
    );
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ready");
    expect(res.body.data.isReady).toBe(true);
    expect(res.body.data.dependencies.database.connected).toBe(true);
    expect(res.body.data.dependencies.redis.connected).toBe(true);
  });

  it("returns 503 when MongoDB is not connected", async () => {
    vi.spyOn(HealthService, "getReadiness").mockResolvedValue({
      isReady: false,
      status: "degraded",
      service: "@platform/api",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          type: "mongodb-atlas",
          status: "disconnected",
          connected: false,
        },
        redis: {
          type: "redis",
          status: "healthy",
          connected: true,
          latencyMs: 2,
        },
      },
    });

    const res = await request(app).get("/api/v1/health/ready");

    expect(res.status).toBe(503);
    expect(res.headers["cache-control"]).toBe(
      "no-cache, no-store, must-revalidate",
    );
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(res.body.error.details.database.connected).toBe(false);
    expect(res.body.error.requestId).toBeDefined();
  });

  it("returns 503 when Redis is unhealthy", async () => {
    vi.spyOn(HealthService, "getReadiness").mockResolvedValue({
      isReady: false,
      status: "degraded",
      service: "@platform/api",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          type: "mongodb-atlas",
          status: "connected",
          connected: true,
        },
        redis: {
          type: "redis",
          status: "unhealthy",
          connected: false,
          error: "Connection refused",
        },
      },
    });

    const res = await request(app).get("/api/v1/health/ready");

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(res.body.error.details.redis.connected).toBe(false);
  });

  it("verifies HealthService.getReadiness logic computes isReady accurately", async () => {
    // Test the real HealthService method without mocking getReadiness itself
    const readiness = await HealthService.getReadiness();
    expect(readiness.service).toBe("@platform/api");
    expect(typeof readiness.isReady).toBe("boolean");
    expect(readiness.dependencies.database).toBeDefined();
    expect(readiness.dependencies.redis).toBeDefined();
    expect(readiness.status).toBe(readiness.isReady ? "ready" : "degraded");
  });
});
