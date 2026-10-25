import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { AppError, errorMiddleware } from "../middleware/error.middleware.js";
import { requestIdMiddleware } from "../middleware/request-id.middleware.js";
import { ERROR_CODES } from "@platform/shared";

describe("Centralized Error Handling Middleware", () => {
  function createTestApp(errorToThrow) {
    const app = express();
    app.use(requestIdMiddleware);
    app.get("/test-error", () => {
      throw errorToThrow;
    });
    app.use(errorMiddleware);
    return app;
  }

  it("correctly handles AppError with custom status and error code", async () => {
    const customError = new AppError(
      "Forbidden access to organization",
      403,
      ERROR_CODES.FORBIDDEN,
      {
        organizationId: "org_123",
      },
    );
    const app = createTestApp(customError);

    const res = await request(app).get("/test-error");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toBe("Forbidden access to organization");
    expect(res.body.error.details).toEqual({ organizationId: "org_123" });
    expect(res.body.error.requestId).toBeDefined();
  });

  it("transforms unexpected generic Error into internal error envelope", async () => {
    const genericError = new Error("Unexpected database syntax error");
    const app = createTestApp(genericError);

    const res = await request(app).get("/test-error");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(res.body.error.requestId).toBeDefined();
  });
});
