import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { requestIdMiddleware } from "./middleware/request-id.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import healthRoutes from "./modules/health/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import organizationRoutes from "./modules/organizations/organization.routes.js";
import invitationRoutes from "./modules/organizations/invitation.routes.js";
import questionRoutes from "./modules/questions/question.routes.js";
import assessmentRoutes from "./modules/assessments/assessment.routes.js";

/**
 * Initialize Express application.
 */
export function createApp() {
  const app = express();

  // Basic security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-Id",
        "Idempotency-Key",
      ],
    }),
  );

  // Request ID tracing
  app.use(requestIdMiddleware);

  // Body parsing
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());

  // HTTP request logging
  if (env.LOG_LEVEL !== "silent" && !env.isTest) {
    morgan.token("id", (req) => req.id);
    app.use(
      morgan(
        "[:date[iso]] [:id] :method :url :status :response-time ms - :res[content-length]",
      ),
    );
  }

  // Mount API v1 modules
  app.use("/api/v1/health", healthRoutes);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/organizations", organizationRoutes);
  app.use("/api/v1/invitations", invitationRoutes);
  app.use("/api/v1/organizations/:organizationId/questions", questionRoutes);
  app.use(
    "/api/v1/organizations/:organizationId/assessments",
    assessmentRoutes,
  );

  // 404 handler
  app.use(notFoundMiddleware);

  // Centralized error handler
  app.use(errorMiddleware);

  return app;
}

const app = createApp();
export default app;
