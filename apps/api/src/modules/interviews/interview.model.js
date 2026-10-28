import mongoose from "mongoose";
import {
  INTERVIEW_STATUS,
  INTERVIEW_TYPE,
  SUPPORTED_LANGUAGES,
} from "@platform/shared";

const InterviewQuestionSnapshotSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    version: { type: Number, required: true },
    title: { type: String, required: true },
    statement: { type: String, required: true },
    constraints: [{ type: String }],
    examples: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String, default: "" },
      },
    ],
    allowedLanguages: {
      type: [String],
      default: () => [...SUPPORTED_LANGUAGES],
    },
    starterCodeByLanguage: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
    publicTests: [
      {
        input: { type: String, required: true },
        expectedOutput: { type: String, required: true },
      },
    ],
    hiddenTests: [
      {
        input: { type: String, required: true },
        expectedOutput: { type: String, required: true },
      },
    ],
    timeLimitMs: { type: Number, default: 2000 },
    memoryLimitMb: { type: Number, default: 256 },
    order: { type: Number, default: 1 },
    timeAllocationMinutes: { type: Number, default: 30 },
  },
  { _id: false },
);

const InterviewCandidateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    externalRef: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const InterviewSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 3000,
    },
    interviewType: {
      type: String,
      enum: Object.values(INTERVIEW_TYPE),
      default: INTERVIEW_TYPE.TECHNICAL,
      required: true,
    },
    candidate: {
      type: InterviewCandidateSchema,
      default: () => ({}),
    },
    interviewerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    assessmentRef: {
      assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assessment",
        default: null,
      },
      version: { type: Number, default: 1 },
      title: { type: String, default: "" },
    },
    questionSnapshots: [InterviewQuestionSnapshotSchema],
    scheduledStartAt: {
      type: Date,
      default: null,
    },
    scheduledEndAt: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 60,
      min: 5,
      max: 600,
    },
    timezone: {
      type: String,
      default: "UTC",
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(INTERVIEW_STATUS),
      default: INTERVIEW_STATUS.DRAFT,
      required: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

InterviewSchema.index({ organizationId: 1, scheduledStartAt: -1 });
InterviewSchema.index({ organizationId: 1, status: 1, scheduledStartAt: 1 });
InterviewSchema.index({ interviewerIds: 1, scheduledStartAt: 1 });

export const Interview = mongoose.model("Interview", InterviewSchema);
