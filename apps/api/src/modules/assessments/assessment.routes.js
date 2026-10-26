import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { requireOrganization } from "../../middleware/authorize-organization.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { PERMISSIONS } from "../organizations/permissions.js";
import { AssessmentController } from "./assessment.controller.js";
import { assessmentValidators } from "./assessment.validation.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  "/",
  requireOrganization(PERMISSIONS.ASSESSMENT_MANAGE),
  validateBody({
    title: assessmentValidators.title,
    description: assessmentValidators.description,
    questions: assessmentValidators.questions,
    totalDurationMinutes: assessmentValidators.totalDurationMinutes,
  }),
  AssessmentController.create,
);

router.get(
  "/",
  requireOrganization(PERMISSIONS.ASSESSMENT_VIEW),
  AssessmentController.list,
);

router.get(
  "/:assessmentId",
  requireOrganization(PERMISSIONS.ASSESSMENT_VIEW),
  AssessmentController.get,
);

router.patch(
  "/:assessmentId",
  requireOrganization(PERMISSIONS.ASSESSMENT_MANAGE),
  validateBody({
    title: assessmentValidators.optionalTitle,
    description: assessmentValidators.description,
    questions: assessmentValidators.questions,
    totalDurationMinutes: assessmentValidators.totalDurationMinutes,
  }),
  AssessmentController.update,
);

router.post(
  "/:assessmentId/archive",
  requireOrganization(PERMISSIONS.ASSESSMENT_MANAGE),
  AssessmentController.archive,
);

router.get(
  "/:assessmentId/preview",
  requireOrganization(PERMISSIONS.ASSESSMENT_VIEW),
  AssessmentController.preview,
);

export default router;
