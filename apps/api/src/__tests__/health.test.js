import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Health Liveness Endpoint (/api/v1/health)", () => {
  it("returns 200 with standard success envelope and service details", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe(
      "no-cache, no-store, must-revalidate",
    );
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.service).toBe("@platform/api");
    expect(res.body.data.version).toBe("0.1.0");
    expect(typeof res.body.data.uptimeSeconds).toBe("number");
    expect(res.body.data.timestamp).toBeDefined();
  });
});
