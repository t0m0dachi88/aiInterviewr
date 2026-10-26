import { createSuccessEnvelope } from "@platform/shared";
import { asyncHandler } from "../../utils/async-handler.js";
import * as assessmentService from "./assessment.service.js";

export const AssessmentController = {
  create: asyncHandler(async (req, res) => {
    const assessment = await assessmentService.createAssessment(
      req.organization.id,
      req.validated,
      req.user,
    );
    return res.status(201).json(createSuccessEnvelope({ assessment }));
  }),

  list: asyncHandler(async (req, res) => {
    const result = await assessmentService.listAssessments(
      req.organization.id,
      req.query,
    );
    return res.status(200).json(
      createSuccessEnvelope(
        { assessments: result.assessments },
        { pagination: result.pagination },
      ),
    );
  }),

  get: asyncHandler(async (req, res) => {
    const assessment = await assessmentService.getAssessment(
      req.organization.id,
      req.params.assessmentId,
    );
    return res.status(200).json(createSuccessEnvelope({ assessment }));
  }),

  update: asyncHandler(async (req, res) => {
    const assessment = await assessmentService.updateAssessment(
      req.organization.id,
      req.params.assessmentId,
      req.validated,
      req.user,
    );
    return res.status(200).json(createSuccessEnvelope({ assessment }));
  }),

  archive: asyncHandler(async (req, res) => {
    const assessment = await assessmentService.archiveAssessment(
      req.organization.id,
      req.params.assessmentId,
    );
    return res.status(200).json(createSuccessEnvelope({ assessment }));
  }),

  preview: asyncHandler(async (req, res) => {
    const preview = await assessmentService.previewAssessment(
      req.organization.id,
      req.params.assessmentId,
    );
    return res.status(200).json(createSuccessEnvelope({ preview }));
  }),
};
