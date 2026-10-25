import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Express Application Initialization & Base Middleware", () => {
  it("assigns a request ID and returns it in the response header", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.headers["x-request-id"]).toMatch(/^req_/);
  });

  it("preserves an incoming X-Request-Id header", async () => {
    const incomingId = "custom-trace-id-12345";
    const res = await request(app)
      .get("/api/v1/health")
      .set("x-request-id", incomingId);

    expect(res.headers["x-request-id"]).toBe(incomingId);
  });

  it("returns a standard 404 error envelope for nonexistent routes", async () => {
    const res = await request(app).get("/nonexistent-path-abc");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toContain("/nonexistent-path-abc");
    expect(res.body.error.requestId).toBeDefined();
  });
});
