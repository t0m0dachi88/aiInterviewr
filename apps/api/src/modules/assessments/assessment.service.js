import mongoose from "mongoose";
import { ERROR_CODES } from "@platform/shared";
import { AppError } from "../../middleware/error.middleware.js";
import { Question } from "../questions/question.model.js";
import { Assessment } from "./assessment.model.js";
import {
  serializeAssessment,
  buildAssessmentSnapshot,
} from "./assessment.serializer.js";

function notFound() {
  return new AppError(
    "The requested assessment was not found",
    404,
    ERROR_CODES.ASSESSMENT_NOT_FOUND,
  );
}

/**
 * Helper to validate question references and compute difficulty distribution.
 */
async function validateAndEnrichQuestions(organizationId, questionItems) {
  if (!questionItems || questionItems.length === 0) {
    return {
      validatedQuestions: [],
      questionsMap: new Map(),
      difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
      calculatedDuration: 30,
    };
  }

  const questionIds = questionItems.map((q) => q.questionId);
  const foundQuestions = await Question.find({
    _id: { $in: questionIds },
    organizationId,
  });

  const questionsMap = new Map(
    foundQuestions.map((q) => [String(q._id), q]),
  );

  const distribution = { easy: 0, medium: 0, hard: 0 };
  let calculatedDuration = 0;

  const validatedQuestions = questionItems.map((item, idx) => {
    const qDoc = questionsMap.get(String(item.questionId));
    if (!qDoc) {
      throw new AppError(
        `Question ${item.questionId} does not belong to this organization`,
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const versionNum = item.questionVersion || qDoc.currentVersion;
    const versionExists = qDoc.versions.some((v) => v.version === versionNum);
    if (!versionExists) {
      throw new AppError(
        `Question version ${versionNum} does not exist for question ${qDoc.title}`,
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const difficulty = qDoc.difficulty || "medium";
    if (distribution[difficulty] !== undefined) {
      distribution[difficulty] += 1;
    }

    const timeAlloc = item.timeAllocationMinutes || qDoc.expectedDurationMinutes || 30;
    calculatedDuration += timeAlloc;

    return {
      questionId: qDoc._id,
      questionVersion: versionNum,
      order: item.order || idx + 1,
      timeAllocationMinutes: timeAlloc,
    };
  });

  return {
    validatedQuestions,
    questionsMap,
    difficultyDistribution: distribution,
    calculatedDuration: Math.max(15, calculatedDuration),
  };
}

export async function createAssessment(organizationId, payload, user) {
  const {
    validatedQuestions,
    questionsMap,
    difficultyDistribution,
    calculatedDuration,
  } = await validateAndEnrichQuestions(organizationId, payload.questions || []);

  const totalDurationMinutes =
    payload.totalDurationMinutes || calculatedDuration;

  const assessment = new Assessment({
    organizationId,
    title: payload.title,
    description: payload.description || "",
    questions: validatedQuestions,
    totalDurationMinutes,
    difficultyDistribution,
    version: 1,
    status: "active",
    createdBy: user.id,
  });

  await assessment.save();

  return serializeAssessment(assessment, questionsMap);
}

export async function listAssessments(organizationId, query = {}) {
  const filter = {
    organizationId,
    status: query.status === "archived" ? "archived" : "active",
  };

  if (query.search) {
    filter.title = new RegExp(query.search.trim(), "i");
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Assessment.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Assessment.countDocuments(filter),
  ]);

  // Collect question ids to enrich listing
  const allQuestionIds = new Set();
  items.forEach((a) => {
    (a.questions || []).forEach((q) => allQuestionIds.add(String(q.questionId)));
  });

  const questionDocs = await Question.find(
    { _id: { $in: Array.from(allQuestionIds) }, organizationId },
    { title: 1, difficulty: 1, category: 1, questionType: 1, supportedLanguages: 1 },
  ).lean();

  const questionsMap = new Map(questionDocs.map((q) => [String(q._id), q]));

  return {
    assessments: items.map((a) => serializeAssessment(a, questionsMap)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAssessment(organizationId, assessmentId) {
  if (!mongoose.isValidObjectId(assessmentId)) {
    throw notFound();
  }

  const assessment = await Assessment.findOne({
    _id: assessmentId,
    organizationId,
  });

  if (!assessment) {
    throw notFound();
  }

  const questionIds = (assessment.questions || []).map((q) => q.questionId);
  const questionDocs = await Question.find({
    _id: { $in: questionIds },
    organizationId,
  });
  const questionsMap = new Map(questionDocs.map((q) => [String(q._id), q]));

  return serializeAssessment(assessment, questionsMap);
}

export async function updateAssessment(organizationId, assessmentId, payload, user) {
  if (!mongoose.isValidObjectId(assessmentId)) {
    throw notFound();
  }

  const assessment = await Assessment.findOne({
    _id: assessmentId,
    organizationId,
  });

  if (!assessment) {
    throw notFound();
  }

  let questionsMap = new Map();

  if (payload.questions !== undefined) {
    const enrichment = await validateAndEnrichQuestions(
      organizationId,
      payload.questions,
    );
    assessment.questions = enrichment.validatedQuestions;
    assessment.difficultyDistribution = enrichment.difficultyDistribution;
    questionsMap = enrichment.questionsMap;

    if (!payload.totalDurationMinutes) {
      assessment.totalDurationMinutes = enrichment.calculatedDuration;
    }
  } else {
    const questionIds = (assessment.questions || []).map((q) => q.questionId);
    const questionDocs = await Question.find({
      _id: { $in: questionIds },
      organizationId,
    });
    questionsMap = new Map(questionDocs.map((q) => [String(q._id), q]));
  }

  if (payload.title !== undefined) assessment.title = payload.title;
  if (payload.description !== undefined) {
    assessment.description = payload.description;
  }
  if (payload.totalDurationMinutes !== undefined) {
    assessment.totalDurationMinutes = payload.totalDurationMinutes;
  }

  // Increment template version on update
  assessment.version += 1;
  await assessment.save();

  return serializeAssessment(assessment, questionsMap);
}

export async function archiveAssessment(organizationId, assessmentId) {
  if (!mongoose.isValidObjectId(assessmentId)) {
    throw notFound();
  }

  const assessment = await Assessment.findOne({
    _id: assessmentId,
    organizationId,
  });

  if (!assessment) {
    throw notFound();
  }

  assessment.status = "archived";
  assessment.archivedAt = new Date();
  await assessment.save();

  return serializeAssessment(assessment);
}

export async function previewAssessment(organizationId, assessmentId) {
  if (!mongoose.isValidObjectId(assessmentId)) {
    throw notFound();
  }

  const assessment = await Assessment.findOne({
    _id: assessmentId,
    organizationId,
  });

  if (!assessment) {
    throw notFound();
  }

  const questionIds = (assessment.questions || []).map((q) => q.questionId);
  const questionDocs = await Question.find({
    _id: { $in: questionIds },
    organizationId,
  });
  const questionsMap = new Map(questionDocs.map((q) => [String(q._id), q]));

  const snapshot = buildAssessmentSnapshot(assessment, questionsMap);
  return snapshot;
}

export async function getAssessmentSnapshot(organizationId, assessmentId) {
  if (!mongoose.isValidObjectId(assessmentId)) {
    throw notFound();
  }

  const assessment = await Assessment.findOne({
    _id: assessmentId,
    organizationId,
  });

  if (!assessment) {
    throw notFound();
  }

  const questionIds = (assessment.questions || []).map((q) => q.questionId);
  const questionDocs = await Question.find({
    _id: { $in: questionIds },
    organizationId,
  });
  const questionsMap = new Map(questionDocs.map((q) => [String(q._id), q]));

  return buildAssessmentSnapshot(assessment, questionsMap);
}
