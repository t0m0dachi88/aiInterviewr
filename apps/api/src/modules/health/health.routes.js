import { Router } from "express";
import { HealthController } from "./health.controller.js";

const router = Router();

// Liveness probe
router.get("/", HealthController.getHealth);

// Readiness probe
router.get("/ready", HealthController.getReadiness);

export default router;
