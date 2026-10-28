import mongoose from "mongoose";
import {
  QUESTION_DIFFICULTY,
  QUESTION_TYPE,
  QUESTION_STATUS,
  SUPPORTED_LANGUAGES,
} from "@platform/shared";

const ExampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: false },
);

const TestCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
  },
  { _id: false },
);

const QuestionVersionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    statement: { type: String, required: true },
    constraints: [{ type: String }],
    examples: [ExampleSchema],
    allowedLanguages: {
      type: [String],
      default: () => [...SUPPORTED_LANGUAGES],
    },
    starterCodeByLanguage: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
    publicTests: [TestCaseSchema],
    hiddenTests: [TestCaseSchema],
    timeLimitMs: { type: Number, default: 2000 },
    memoryLimitMb: { type: Number, default: 256 },
    changeSummary: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const QuestionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      required: true,
      default: "data_structures_and_algorithms",
      trim: true,
    },
    difficulty: {
      type: String,
      enum: Object.values(QUESTION_DIFFICULTY),
      default: QUESTION_DIFFICULTY.MEDIUM,
      required: true,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    expectedDurationMinutes: {
      type: Number,
      default: 30,
      min: 5,
      max: 300,
    },
    questionType: {
      type: String,
      enum: Object.values(QUESTION_TYPE),
      default: QUESTION_TYPE.CODING,
      required: true,
    },
    supportedLanguages: {
      type: [String],
      default: () => [...SUPPORTED_LANGUAGES],
    },
    status: {
      type: String,
      enum: Object.values(QUESTION_STATUS),
      default: QUESTION_STATUS.ACTIVE,
      required: true,
    },
    currentVersion: {
      type: Number,
      default: 1,
      required: true,
    },
    versions: [QuestionVersionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

QuestionSchema.index({ organizationId: 1, status: 1, updatedAt: -1 });
QuestionSchema.index({ organizationId: 1, slug: 1 });
QuestionSchema.index({ organizationId: 1, category: 1 });
QuestionSchema.index({ organizationId: 1, difficulty: 1 });

export const Question = mongoose.model("Question", QuestionSchema);
