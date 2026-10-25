import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

describe("Frontend Auth & Organization Flows", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders Login page with email and password fields", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/create one now/i)).toBeInTheDocument();
  });

  it("renders Register page with password criteria checklist", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByText(/8\+ characters/i)).toBeInTheDocument();
    expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 1 number/i)).toBeInTheDocument();
  });

  it("redirects unauthenticated user accessing protected dashboard to /login", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/refresh")) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Auth required" },
          }),
        });
      }
      return Promise.reject(new Error("Unknown route"));
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={<div>Login Page Redirect Target</div>}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Login Page Redirect Target"),
      ).toBeInTheDocument();
    });
  });

  it("allows registration and displays dashboard organization creation when user has no orgs", async () => {
    const user = userEvent.setup();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/refresh")) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ success: false }),
        });
      }
      if (url.includes("/auth/register")) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: {
              user: {
                id: "user_123",
                email: "alex@example.com",
                displayName: "Alex Rivera",
                status: "active",
              },
              accessToken: "fake-access-token",
              expiresIn: 900,
            },
          }),
        });
      }
      if (url.includes("/organizations") && !url.includes("/members")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { organizations: [] },
          }),
        });
      }
      return Promise.reject(new Error("Unhandled route: " + url));
    });

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <AuthProvider>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/full name/i), "Alex Rivera");
    await user.type(screen.getByLabelText(/work email/i), "alex@example.com");
    await user.type(screen.getByLabelText(/password/i), "SecurePassword123!");

    const submitBtn = screen.getByRole("button", { name: /create account/i });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/create your first organization/i),
      ).toBeInTheDocument();
    });
  });
});
