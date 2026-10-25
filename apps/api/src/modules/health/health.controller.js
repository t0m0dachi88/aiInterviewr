import { ERROR_CODES } from "@platform/shared";
import { HealthService } from "./health.service.js";
import { sendSuccess } from "../../utils/response.js";

/**
 * Health Controller handles HTTP requests for system liveness and readiness.
 */
export class HealthController {
  /**
   * GET /api/v1/health
   * Liveness probe: returns 200 if the Express process is running.
   */
  static getHealth(req, res) {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    const liveness = HealthService.getLiveness();
    return sendSuccess(res, liveness, {}, 200);
  }

  /**
   * GET /api/v1/health/ready
   * Readiness probe: checks external dependencies (MongoDB Atlas & Redis).
   */
  static async getReadiness(req, res) {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    const readiness = await HealthService.getReadiness();

    if (readiness.isReady) {
      return sendSuccess(res, readiness, {}, 200);
    }

    return res.status(503).json({
      success: false,
      error: {
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
        message: "One or more required service dependencies are unavailable",
        requestId: req.id,
        details: readiness.dependencies,
      },
    });
  }
}
