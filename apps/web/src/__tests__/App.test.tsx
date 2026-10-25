import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("Frontend Application Foundation", () => {
  beforeEach(() => {
    // Mock global fetch for health checks so tests don't make real network calls
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/health/ready")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
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
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            status: "ok",
            service: "@platform/api",
            version: "0.1.0",
            uptimeSeconds: 42,
            timestamp: new Date().toISOString(),
          },
        }),
      });
    });
  });

  it("renders application navigation and brand title", () => {
    render(<App />);
    expect(screen.getByText("HirePulse")).toBeInTheDocument();
    expect(screen.getByText("Phase 1")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("renders platform overview headline on home route", () => {
    render(<App />);
    expect(screen.getByText(/AI-Powered Technical/i)).toBeInTheDocument();
    expect(screen.getByText(/Hiring Infrastructure/i)).toBeInTheDocument();
    expect(screen.getByText(/Core Architecture Pillars/i)).toBeInTheDocument();
  });
});
