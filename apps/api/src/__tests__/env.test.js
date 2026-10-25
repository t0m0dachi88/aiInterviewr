import { describe, it, expect } from "vitest";
import { validateEnv } from "../config/env.js";

describe("Environment Validation", () => {
  const validUpstashEnv = {
    PORT: "5000",
    NODE_ENV: "test",
    MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/testdb",
    UPSTASH_REDIS_HOST: "flowing-mammal-12345.upstash.io",
    UPSTASH_REDIS_PORT: "6379",
    UPSTASH_REDIS_PASSWORD: "secret_password_123",
    UPSTASH_REDIS_TLS: "true",
    CORS_ORIGIN: "http://localhost:5173",
    LOG_LEVEL: "silent",
  };

  it("validates a correct Upstash Redis configuration", () => {
    const config = validateEnv(validUpstashEnv);
    expect(config.PORT).toBe(5000);
    expect(config.NODE_ENV).toBe("test");
    expect(config.MONGODB_URI).toBe(validUpstashEnv.MONGODB_URI);
    expect(config.redis.host).toBe("flowing-mammal-12345.upstash.io");
    expect(config.redis.port).toBe(6379);
    expect(config.redis.password).toBe("secret_password_123");
    expect(config.redis.tls).toBe(true);
    expect(config.redis.isConfigured).toBe(true);
    expect(config.isTest).toBe(true);
  });

  it("validates a correct REDIS_URL configuration with TLS (rediss://)", () => {
    const config = validateEnv({
      PORT: "5000",
      NODE_ENV: "test",
      MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/testdb",
      REDIS_URL: "rediss://default:pass@flowing-mammal-12345.upstash.io:6379",
      LOG_LEVEL: "silent",
    });
    expect(config.redis.url).toBe(
      "rediss://default:pass@flowing-mammal-12345.upstash.io:6379",
    );
    expect(config.redis.isConfigured).toBe(true);
  });

  it("fails if PORT is invalid", () => {
    expect(() => validateEnv({ ...validUpstashEnv, PORT: "abc" })).toThrow(
      /PORT must be a valid port number/,
    );
    expect(() => validateEnv({ ...validUpstashEnv, PORT: "999999" })).toThrow(
      /PORT must be a valid port number/,
    );
  });

  it("fails in production if MONGODB_URI is missing", () => {
    const missing = { ...validUpstashEnv, NODE_ENV: "production" };
    delete missing.MONGODB_URI;
    expect(() => validateEnv(missing)).toThrow(
      /MONGODB_URI is required in production/,
    );
  });

  it("fails if MONGODB_URI has invalid protocol", () => {
    expect(() =>
      validateEnv({ ...validUpstashEnv, MONGODB_URI: "http://mongodb.com" }),
    ).toThrow(/MONGODB_URI must start with mongodb:\/\/ or mongodb\+srv:\/\//);
  });

  it("fails in production if Upstash Redis credentials are completely missing", () => {
    const missing = {
      PORT: "5000",
      NODE_ENV: "production",
      MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/testdb",
      LOG_LEVEL: "silent",
    };
    expect(() => validateEnv(missing)).toThrow(
      /Redis configuration is required in production/,
    );
  });

  it("fails if REDIS_URL has invalid protocol", () => {
    expect(() =>
      validateEnv({ ...validUpstashEnv, REDIS_URL: "http://redis.com" }),
    ).toThrow(/REDIS_URL must start with redis:\/\/ or rediss:\/\//);
  });
});
