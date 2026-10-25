import dotenv from "dotenv";

dotenv.config();

export function validateWorkerEnv(envObj = process.env) {
  const NODE_ENV = envObj.NODE_ENV || "development";
  const isProduction = NODE_ENV === "production";

  const WORKER_REDIS_HOST =
    envObj.WORKER_REDIS_HOST || envObj.UPSTASH_REDIS_HOST || "";
  const WORKER_REDIS_PORT = parseInt(
    envObj.WORKER_REDIS_PORT || envObj.UPSTASH_REDIS_PORT || "6379",
    10,
  );
  const WORKER_REDIS_PASSWORD =
    envObj.WORKER_REDIS_PASSWORD || envObj.UPSTASH_REDIS_PASSWORD || "";
  const WORKER_REDIS_TLS =
    envObj.WORKER_REDIS_TLS !== undefined
      ? envObj.WORKER_REDIS_TLS === "true"
      : envObj.UPSTASH_REDIS_TLS !== undefined
        ? envObj.UPSTASH_REDIS_TLS === "true"
        : Boolean(
            WORKER_REDIS_HOST && WORKER_REDIS_HOST.includes("upstash.io"),
          );

  const WORKER_REDIS_URL = envObj.WORKER_REDIS_URL || envObj.REDIS_URL || "";

  const isConfigured = Boolean(
    (WORKER_REDIS_HOST && WORKER_REDIS_PASSWORD) || WORKER_REDIS_URL,
  );
  const concurrency = parseInt(envObj.WORKER_CONCURRENCY || "5", 10);

  return Object.freeze({
    NODE_ENV,
    isProduction,
    redis: Object.freeze({
      host: WORKER_REDIS_HOST,
      port: WORKER_REDIS_PORT,
      password: WORKER_REDIS_PASSWORD,
      tls: WORKER_REDIS_TLS,
      url: WORKER_REDIS_URL,
      isConfigured,
    }),
    concurrency,
  });
}

export const workerEnv = validateWorkerEnv(process.env);
