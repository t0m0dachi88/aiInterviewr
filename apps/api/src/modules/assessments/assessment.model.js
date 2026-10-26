import mongoose from "mongoose";

const AssessmentQuestionItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    questionVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    order: {
      type: Number,
      required: true,
      default: 1,
    },
    timeAllocationMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: 1,
      max: 300,
    },
  },
  { _id: false },
);

const AssessmentSchema = new mongoose.Schema(
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
      maxlength: 2000,
    },
    questions: [AssessmentQuestionItemSchema],
    totalDurationMinutes: {
      type: Number,
      default: 60,
      min: 5,
      max: 600,
    },
    difficultyDistribution: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
    version: {
      type: Number,
      default: 1,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      required: true,
    },
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

AssessmentSchema.index({ organizationId: 1, status: 1, updatedAt: -1 });

export const Assessment = mongoose.model("Assessment", AssessmentSchema);
