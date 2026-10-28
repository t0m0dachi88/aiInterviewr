import mongoose from "mongoose";
import { CANDIDATE_INVITATION_STATUS } from "@platform/shared";

const CandidateInvitationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
      index: true,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    candidateEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    externalRef: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(CANDIDATE_INVITATION_STATUS),
      default: CANDIDATE_INVITATION_STATUS.PENDING,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    declinedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

CandidateInvitationSchema.index({ interviewId: 1, candidateEmail: 1, status: 1 });
CandidateInvitationSchema.index({ organizationId: 1, status: 1 });

export const CandidateInvitation = mongoose.model(
  "CandidateInvitation",
  CandidateInvitationSchema,
);
