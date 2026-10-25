import { describe, it, expect } from "vitest";
import {
  createSuccessEnvelope,
  createErrorEnvelope,
  ERROR_CODES,
  SUPPORTED_LANGUAGES,
} from "../index.js";

describe("Shared Envelope and Constants", () => {
  it("creates a standard success envelope", () => {
    const data = { user: "test" };
    const meta = { page: 1 };
    const res = createSuccessEnvelope(data, meta);

    expect(res).toEqual({
      success: true,
      data: { user: "test" },
      meta: { page: 1 },
    });
  });

  it("creates a standard error envelope", () => {
    const res = createErrorEnvelope(
      ERROR_CODES.NOT_FOUND,
      "Resource missing",
      "req_123",
      { field: "id" },
    );

    expect(res).toEqual({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Resource missing",
        requestId: "req_123",
        details: { field: "id" },
      },
    });
  });

  it("verifies supported languages list", () => {
    expect(SUPPORTED_LANGUAGES).toContain("javascript");
    expect(SUPPORTED_LANGUAGES).toContain("python");
    expect(SUPPORTED_LANGUAGES).toContain("cpp");
    expect(SUPPORTED_LANGUAGES).toHaveLength(3);
  });
});
