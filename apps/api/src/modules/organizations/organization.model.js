import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 60,
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    settings: {
      defaultInterviewDurationMinutes: { type: Number, default: 60, min: 15 },
      recordingEnabled: { type: Boolean, default: false },
      allowedLanguages: {
        type: [String],
        default: () => ["javascript", "python", "cpp"],
      },
      dataRetentionDays: { type: Number, default: 365, min: 1 },
    },
  },
  { timestamps: true },
);

organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ ownerUserId: 1 });

export const Organization =
  mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);
