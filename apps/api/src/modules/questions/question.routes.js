import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { requireOrganization } from "../../middleware/authorize-organization.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { PERMISSIONS } from "../organizations/permissions.js";
import { QuestionController } from "./question.controller.js";
import { questionValidators } from "./question.validation.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  "/",
  requireOrganization(PERMISSIONS.QUESTION_MANAGE),
  validateBody({
    title: questionValidators.title,
    category: questionValidators.category,
    difficulty: questionValidators.difficulty,
    questionType: questionValidators.questionType,
    statement: questionValidators.statement,
    tags: questionValidators.tags,
    expectedDurationMinutes: questionValidators.expectedDurationMinutes,
    constraints: questionValidators.constraints,
    examples: questionValidators.examples,
    allowedLanguages: questionValidators.allowedLanguages,
    starterCodeByLanguage: questionValidators.starterCodeByLanguage,
    publicTests: questionValidators.publicTests,
    hiddenTests: questionValidators.hiddenTests,
    timeLimitMs: questionValidators.timeLimitMs,
    memoryLimitMb: questionValidators.memoryLimitMb,
    changeSummary: questionValidators.changeSummary,
  }),
  QuestionController.create,
);

router.get(
  "/",
  requireOrganization(PERMISSIONS.QUESTION_VIEW),
  QuestionController.list,
);

router.get(
  "/:questionId",
  requireOrganization(PERMISSIONS.QUESTION_VIEW),
  QuestionController.get,
);

router.patch(
  "/:questionId",
  requireOrganization(PERMISSIONS.QUESTION_MANAGE),
  validateBody({
    title: questionValidators.optionalTitle,
    category: questionValidators.optionalCategory,
    difficulty: questionValidators.optionalDifficulty,
    questionType: questionValidators.optionalQuestionType,
    statement: questionValidators.optionalStatement,
    tags: questionValidators.tags,
    expectedDurationMinutes: questionValidators.optionalExpectedDurationMinutes,
    constraints: questionValidators.constraints,
    examples: questionValidators.examples,
    allowedLanguages: questionValidators.allowedLanguages,
    starterCodeByLanguage: questionValidators.starterCodeByLanguage,
    publicTests: questionValidators.publicTests,
    hiddenTests: questionValidators.hiddenTests,
    timeLimitMs: questionValidators.timeLimitMs,
    memoryLimitMb: questionValidators.memoryLimitMb,
    changeSummary: questionValidators.changeSummary,
  }),
  QuestionController.update,
);

router.post(
  "/:questionId/archive",
  requireOrganization(PERMISSIONS.QUESTION_MANAGE),
  QuestionController.archive,
);

router.get(
  "/:questionId/versions",
  requireOrganization(PERMISSIONS.QUESTION_VIEW),
  QuestionController.getVersions,
);

export default router;
