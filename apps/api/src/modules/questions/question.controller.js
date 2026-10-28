import { createSuccessEnvelope } from "@platform/shared";
import { asyncHandler } from "../../utils/async-handler.js";
import * as questionService from "./question.service.js";

export const QuestionController = {
  create: asyncHandler(async (req, res) => {
    const question = await questionService.createQuestion(
      req.organization.id,
      req.validated,
      req.user,
    );
    return res.status(201).json(createSuccessEnvelope({ question }));
  }),

  list: asyncHandler(async (req, res) => {
    const result = await questionService.listQuestions(
      req.organization.id,
      req.query,
    );
    return res.status(200).json(
      createSuccessEnvelope(
        { questions: result.questions },
        { pagination: result.pagination },
      ),
    );
  }),

  get: asyncHandler(async (req, res) => {
    const version = req.query.version
      ? parseInt(req.query.version, 10)
      : undefined;
    const question = await questionService.getQuestion(
      req.organization.id,
      req.params.questionId,
      { version, includeHiddenTests: true, includeHistory: true },
    );
    return res.status(200).json(createSuccessEnvelope({ question }));
  }),

  update: asyncHandler(async (req, res) => {
    const question = await questionService.updateQuestion(
      req.organization.id,
      req.params.questionId,
      req.validated,
      req.user,
    );
    return res.status(200).json(createSuccessEnvelope({ question }));
  }),

  archive: asyncHandler(async (req, res) => {
    const question = await questionService.archiveQuestion(
      req.organization.id,
      req.params.questionId,
    );
    return res.status(200).json(createSuccessEnvelope({ question }));
  }),

  getVersions: asyncHandler(async (req, res) => {
    const versions = await questionService.getQuestionVersions(
      req.organization.id,
      req.params.questionId,
    );
    return res.status(200).json(createSuccessEnvelope(versions));
  }),
};
