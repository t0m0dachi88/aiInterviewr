import mongoose from "mongoose";
import { ERROR_CODES, QUESTION_STATUS } from "@platform/shared";
import { AppError } from "../../middleware/error.middleware.js";
import { slugify, uniqueSlug } from "../../utils/slug.js";
import { Question } from "./question.model.js";
import {
  serializeQuestion,
  buildQuestionSnapshot,
} from "./question.serializer.js";

function notFound() {
  return new AppError(
    "The requested question was not found",
    404,
    ERROR_CODES.QUESTION_NOT_FOUND,
  );
}

export async function createQuestion(organizationId, payload, user) {
  let candidateSlug = payload.slug || slugify(payload.title);

  // Check slug uniqueness within organization
  const existingWithSlug = await Question.findOne({
    organizationId,
    slug: candidateSlug,
  });
  if (existingWithSlug) {
    candidateSlug = uniqueSlug(candidateSlug);
  }

  const initialVersion = {
    version: 1,
    title: payload.title,
    statement: payload.statement,
    constraints: payload.constraints || [],
    examples: payload.examples || [],
    allowedLanguages: payload.allowedLanguages || payload.supportedLanguages,
    starterCodeByLanguage: payload.starterCodeByLanguage || {},
    publicTests: payload.publicTests || [],
    hiddenTests: payload.hiddenTests || [],
    timeLimitMs: payload.timeLimitMs ?? 2000,
    memoryLimitMb: payload.memoryLimitMb ?? 256,
    changeSummary: payload.changeSummary || "Initial version",
    createdBy: user.id,
    createdAt: new Date(),
  };

  const question = new Question({
    organizationId,
    title: payload.title,
    slug: candidateSlug,
    category: payload.category || "data_structures_and_algorithms",
    difficulty: payload.difficulty,
    tags: payload.tags || [],
    expectedDurationMinutes: payload.expectedDurationMinutes ?? 30,
    questionType: payload.questionType || "coding",
    supportedLanguages: payload.supportedLanguages || payload.allowedLanguages,
    status: QUESTION_STATUS.ACTIVE,
    currentVersion: 1,
    versions: [initialVersion],
    createdBy: user.id,
  });

  await question.save();

  return serializeQuestion(question, {
    includeHiddenTests: true,
    includeHistory: true,
  });
}

export async function listQuestions(organizationId, query = {}) {
  const filter = { organizationId };

  // Status filtering
  if (query.status === "all") {
    // Return both active and archived
  } else if (query.status === "archived") {
    filter.status = QUESTION_STATUS.ARCHIVED;
  } else {
    filter.status = QUESTION_STATUS.ACTIVE;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.difficulty) {
    filter.difficulty = query.difficulty;
  }

  if (query.questionType) {
    filter.questionType = query.questionType;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), "i");
    filter.$or = [{ title: searchRegex }, { tags: searchRegex }];
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Question.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Question.countDocuments(filter),
  ]);

  return {
    questions: items.map((q) =>
      serializeQuestion(q, { includeHiddenTests: false }),
    ),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getQuestion(organizationId, questionId, options = {}) {
  if (!mongoose.isValidObjectId(questionId)) {
    throw notFound();
  }

  const question = await Question.findOne({
    _id: questionId,
    organizationId,
  });

  if (!question) {
    throw notFound();
  }

  return serializeQuestion(question, {
    includeHiddenTests: options.includeHiddenTests ?? true,
    version: options.version,
    includeHistory: options.includeHistory ?? true,
  });
}

export async function updateQuestion(organizationId, questionId, payload, user) {
  if (!mongoose.isValidObjectId(questionId)) {
    throw notFound();
  }

  const question = await Question.findOne({
    _id: questionId,
    organizationId,
  });

  if (!question) {
    throw notFound();
  }

  const currentVersionData =
    question.versions.find((v) => v.version === question.currentVersion) ||
    question.versions[question.versions.length - 1];

  // Detect whether content fields changed requiring a new immutable question version
  const hasContentChanges =
    (payload.statement !== undefined && payload.statement !== currentVersionData.statement) ||
    (payload.constraints !== undefined) ||
    (payload.examples !== undefined) ||
    (payload.starterCodeByLanguage !== undefined) ||
    (payload.publicTests !== undefined) ||
    (payload.hiddenTests !== undefined) ||
    (payload.allowedLanguages !== undefined) ||
    (payload.timeLimitMs !== undefined && payload.timeLimitMs !== currentVersionData.timeLimitMs) ||
    (payload.memoryLimitMb !== undefined && payload.memoryLimitMb !== currentVersionData.memoryLimitMb) ||
    (payload.title !== undefined && payload.title !== question.title);

  if (hasContentChanges) {
    const nextVersionNum = question.currentVersion + 1;

    let mergedStarterCode = currentVersionData.starterCodeByLanguage;
    if (payload.starterCodeByLanguage) {
      mergedStarterCode = payload.starterCodeByLanguage;
    }

    const newVersion = {
      version: nextVersionNum,
      title: payload.title || question.title,
      statement: payload.statement ?? currentVersionData.statement,
      constraints: payload.constraints ?? currentVersionData.constraints,
      examples: payload.examples ?? currentVersionData.examples,
      allowedLanguages:
        payload.allowedLanguages ?? currentVersionData.allowedLanguages,
      starterCodeByLanguage: mergedStarterCode,
      publicTests: payload.publicTests ?? currentVersionData.publicTests,
      hiddenTests: payload.hiddenTests ?? currentVersionData.hiddenTests,
      timeLimitMs: payload.timeLimitMs ?? currentVersionData.timeLimitMs,
      memoryLimitMb: payload.memoryLimitMb ?? currentVersionData.memoryLimitMb,
      changeSummary:
        payload.changeSummary || `Updated to version ${nextVersionNum}`,
      createdBy: user.id,
      createdAt: new Date(),
    };

    question.versions.push(newVersion);
    question.currentVersion = nextVersionNum;
  }

  // Update top-level metadata
  if (payload.title) question.title = payload.title;
  if (payload.category) question.category = payload.category;
  if (payload.difficulty) question.difficulty = payload.difficulty;
  if (payload.tags) question.tags = payload.tags;
  if (payload.expectedDurationMinutes) {
    question.expectedDurationMinutes = payload.expectedDurationMinutes;
  }
  if (payload.questionType) question.questionType = payload.questionType;
  if (payload.supportedLanguages) {
    question.supportedLanguages = payload.supportedLanguages;
  }

  await question.save();

  return serializeQuestion(question, {
    includeHiddenTests: true,
    includeHistory: true,
  });
}

export async function archiveQuestion(organizationId, questionId) {
  if (!mongoose.isValidObjectId(questionId)) {
    throw notFound();
  }

  const question = await Question.findOne({
    _id: questionId,
    organizationId,
  });

  if (!question) {
    throw notFound();
  }

  question.status = QUESTION_STATUS.ARCHIVED;
  question.archivedAt = new Date();
  await question.save();

  return serializeQuestion(question, {
    includeHiddenTests: false,
    includeHistory: false,
  });
}

export async function getQuestionVersions(organizationId, questionId) {
  if (!mongoose.isValidObjectId(questionId)) {
    throw notFound();
  }

  const question = await Question.findOne(
    { _id: questionId, organizationId },
    { versions: 1, title: 1, currentVersion: 1 },
  ).lean();

  if (!question) {
    throw notFound();
  }

  return {
    questionId: String(question._id),
    title: question.title,
    currentVersion: question.currentVersion,
    versions: (question.versions || []).map((v) => ({
      version: v.version,
      title: v.title,
      changeSummary: v.changeSummary || "",
      createdBy: String(v.createdBy),
      createdAt: v.createdAt ? v.createdAt.toISOString() : null,
    })),
  };
}

export async function getQuestionSnapshot(organizationId, questionId, versionNumber = null) {
  if (!mongoose.isValidObjectId(questionId)) {
    throw notFound();
  }

  const question = await Question.findOne({
    _id: questionId,
    organizationId,
  });

  if (!question) {
    throw notFound();
  }

  return buildQuestionSnapshot(question, versionNumber);
}
