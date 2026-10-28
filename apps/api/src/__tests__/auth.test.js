import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { connectTestDb, clearTestDb, disconnectTestDb } from "../test/db.js";
import { User } from "../modules/auth/user.model.js";
import { Session } from "../modules/auth/session.model.js";

describe("Auth API Endpoints (/api/v1/auth)", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe("POST /api/v1/auth/register", () => {
    it("successfully registers a new user and sets auth cookies", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Alice Smith",
        email: "alice@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe("alice@example.com");
      expect(res.body.data.user.displayName).toBe("Alice Smith");
      expect(res.body.data.accessToken).toBeDefined();

      // Check cookies
      const cookies = res.headers["set-cookie"] || [];
      const hasRefresh = cookies.some((c) => c.includes("refresh_token="));
      const hasCsrf = cookies.some((c) => c.includes("csrf_token="));
      expect(hasRefresh).toBe(true);
      expect(hasCsrf).toBe(true);

      // Verify DB persistence
      const userInDb = await User.findOne({ email: "alice@example.com" });
      expect(userInDb).not.toBeNull();
      expect(userInDb.displayName).toBe("Alice Smith");

      // Verify Session in DB
      const session = await Session.findOne({ userId: userInDb._id });
      expect(session).not.toBeNull();
      expect(session.revokedAt).toBeNull();
    });

    it("rejects registration with invalid email or weak password", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Bad User",
        email: "not-an-email",
        password: "weak",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.fields.email).toBeDefined();
      expect(res.body.error.details.fields.password).toBeDefined();
    });

    it("rejects registration with duplicate email", async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "First User",
        email: "duplicate@example.com",
        password: "Password123!",
      });

      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Second User",
        email: "duplicate@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CONFLICT");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "Login User",
        email: "login@example.com",
        password: "Password123!",
      });
    });

    it("successfully logs in with valid credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "login@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("login@example.com");
      expect(res.body.data.accessToken).toBeDefined();

      const cookies = res.headers["set-cookie"] || [];
      expect(cookies.some((c) => c.includes("refresh_token="))).toBe(true);
    });

    it("rejects invalid password with 401 UNAUTHORIZED", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "login@example.com",
        password: "WrongPassword!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects unknown email with 401 UNAUTHORIZED", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "unknown@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("returns profile for authenticated user with valid Bearer token", async () => {
      const reg = await request(app).post("/api/v1/auth/register").send({
        name: "Profile User",
        email: "profile@example.com",
        password: "Password123!",
      });
      const token = reg.body.data.accessToken;

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("profile@example.com");
      expect(res.body.data.user.displayName).toBe("Profile User");
    });

    it("rejects unauthenticated request with 401", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("POST /api/v1/auth/refresh & token rotation", () => {
    it("refreshes access token and rotates refresh token cookie", async () => {
      const reg = await request(app).post("/api/v1/auth/register").send({
        name: "Refresh User",
        email: "refresh@example.com",
        password: "Password123!",
      });

      const cookies = reg.headers["set-cookie"];
      const refreshCookie = cookies.find((c) => c.startsWith("refresh_token="));
      const csrfCookie = cookies.find((c) => c.startsWith("csrf_token="));

      const csrfToken = csrfCookie.split(";")[0].split("=")[1];

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", [refreshCookie, csrfCookie])
        .set("X-CSRF-Token", csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      const newCookies = res.headers["set-cookie"];
      const newRefreshCookie = newCookies.find((c) =>
        c.startsWith("refresh_token="),
      );
      expect(newRefreshCookie).toBeDefined();
      expect(newRefreshCookie).not.toEqual(refreshCookie);
    });

    it("rejects refresh if CSRF token is missing", async () => {
      const reg = await request(app).post("/api/v1/auth/register").send({
        name: "No CSRF User",
        email: "nocsrf@example.com",
        password: "Password123!",
      });

      const cookies = reg.headers["set-cookie"];
      const refreshCookie = cookies.find((c) => c.startsWith("refresh_token="));

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", [refreshCookie]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("POST /api/v1/auth/logout and logout-all", () => {
    it("logs out and clears cookies", async () => {
      const reg = await request(app).post("/api/v1/auth/register").send({
        name: "Logout User",
        email: "logout@example.com",
        password: "Password123!",
      });

      const cookies = reg.headers["set-cookie"];
      const refreshCookie = cookies.find((c) => c.startsWith("refresh_token="));
      const csrfCookie = cookies.find((c) => c.startsWith("csrf_token="));
      const csrfToken = csrfCookie.split(";")[0].split("=")[1];

      const res = await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", [refreshCookie, csrfCookie])
        .set("X-CSRF-Token", csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.data.loggedOut).toBe(true);

      const clearCookies = res.headers["set-cookie"] || [];
      expect(
        clearCookies.some(
          (c) => c.includes("refresh_token=;") || c.includes("Max-Age=0"),
        ),
      ).toBe(true);
    });
  });
});
