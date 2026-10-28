import mongoose from "mongoose";
import {
  ERROR_CODES,
  INTERVIEW_STATUS,
} from "@platform/shared";
import { AppError } from "../../middleware/error.middleware.js";
import { OrganizationMembership } from "../organizations/membership.model.js";
import { User } from "../auth/user.model.js";
import { Question } from "../questions/question.model.js";
import { Assessment } from "../assessments/assessment.model.js";
import { buildQuestionSnapshot } from "../questions/question.serializer.js";
import { CandidateInvitation } from "../candidates/candidate-invitation.model.js";
import { Interview } from "./interview.model.js";
import { serializeInterview } from "./interview.serializer.js";

const VALID_TRANSITIONS = Object.freeze({
  [INTERVIEW_STATUS.DRAFT]: [
    INTERVIEW_STATUS.SCHEDULED,
    INTERVIEW_STATUS.CANCELLED,
  ],
  [INTERVIEW_STATUS.SCHEDULED]: [
    INTERVIEW_STATUS.IN_PROGRESS,
    INTERVIEW_STATUS.WAITING,
    INTERVIEW_STATUS.LIVE,
    INTERVIEW_STATUS.CANCELLED,
  ],
  [INTERVIEW_STATUS.WAITING]: [
    INTERVIEW_STATUS.LIVE,
    INTERVIEW_STATUS.IN_PROGRESS,
    INTERVIEW_STATUS.CANCELLED,
  ],
  [INTERVIEW_STATUS.LIVE]: [
    INTERVIEW_STATUS.COMPLETED,
    INTERVIEW_STATUS.CANCELLED,
  ],
  [INTERVIEW_STATUS.IN_PROGRESS]: [
    INTERVIEW_STATUS.COMPLETED,
    INTERVIEW_STATUS.CANCELLED,
  ],
  [INTERVIEW_STATUS.COMPLETED]: [],
  [INTERVIEW_STATUS.CANCELLED]: [],
});

function notFound() {
  return new AppError(
    "The requested interview was not found",
    404,
    ERROR_CODES.INTERVIEW_NOT_FOUND,
  );
}

/**
 * Validate that all interviewer IDs are active members of the organization.
 */
async function validateInterviewerMemberships(organizationId, interviewerIds) {
  if (!interviewerIds || interviewerIds.length === 0) return [];

  const memberships = await OrganizationMembership.find({
    organizationId,
    userId: { $in: interviewerIds },
    status: "active",
  }).lean();

  const activeMemberUserIds = new Set(
    memberships.map((m) => String(m.userId)),
  );

  for (const id of interviewerIds) {
    if (!activeMemberUserIds.has(String(id))) {
      throw new AppError(
        `User ${id} is not an active member of this organization`,
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
  }

  return interviewerIds.map((id) => new mongoose.Types.ObjectId(id));
}

/**
 * Snapshot assessment and questions to freeze them in the interview.
 */
async function resolveQuestionSnapshots(
  organizationId,
  { assessmentId, questions },
) {
  let assessmentRef = {
    assessmentId: null,
    version: 1,
    title: "",
  };
  const questionSnapshots = [];

  if (assessmentId) {
    const assessment = await Assessment.findOne({
      _id: assessmentId,
      organizationId,
    });
    if (!assessment) {
      throw new AppError(
        "Assessment does not exist in this organization",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    assessmentRef = {
      assessmentId: assessment._id,
      version: assessment.version,
      title: assessment.title,
    };

    const questionIds = (assessment.questions || []).map((q) => q.questionId);
    const questionDocs = await Question.find({
      _id: { $in: questionIds },
      organizationId,
    });
    const qMap = new Map(questionDocs.map((q) => [String(q._id), q]));

    for (const item of assessment.questions || []) {
      const qDoc = qMap.get(String(item.questionId));
      if (qDoc) {
        const snap = buildQuestionSnapshot(qDoc, item.questionVersion);
        questionSnapshots.push({
          ...snap,
          order: item.order,
          timeAllocationMinutes: item.timeAllocationMinutes,
        });
      }
    }
  } else if (Array.isArray(questions) && questions.length > 0) {
    const questionIds = questions.map((q) => q.questionId);
    const questionDocs = await Question.find({
      _id: { $in: questionIds },
      organizationId,
    });
    const qMap = new Map(questionDocs.map((q) => [String(q._id), q]));

    for (let i = 0; i < questions.length; i++) {
      const item = questions[i];
      const qDoc = qMap.get(String(item.questionId));
      if (!qDoc) {
        throw new AppError(
          `Question ${item.questionId} not found in this organization`,
          400,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }
      const snap = buildQuestionSnapshot(qDoc, item.questionVersion);
      questionSnapshots.push({
        ...snap,
        order: item.order || i + 1,
        timeAllocationMinutes: item.timeAllocationMinutes || 30,
      });
    }
  }

  return { assessmentRef, questionSnapshots };
}

export async function createInterview(organizationId, payload, user) {
  // Validate interviewers
  const validatedInterviewerIds = await validateInterviewerMemberships(
    organizationId,
    payload.interviewerIds || [],
  );

  // Snapshot assessment and question templates
  const { assessmentRef, questionSnapshots } = await resolveQuestionSnapshots(
    organizationId,
    {
      assessmentId: payload.assessmentId,
      questions: payload.questions,
    },
  );

  let scheduledStartAt = payload.scheduledStartAt || null;
  let scheduledEndAt = payload.scheduledEndAt || null;
  const durationMinutes = payload.durationMinutes || 60;

  if (scheduledStartAt) {
    if (!scheduledEndAt) {
      scheduledEndAt = new Date(
        scheduledStartAt.getTime() + durationMinutes * 60000,
      );
    } else if (scheduledEndAt <= scheduledStartAt) {
      throw new AppError(
        "Scheduled end time must be after scheduled start time",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
  }

  const status =
    payload.status === INTERVIEW_STATUS.SCHEDULED && !scheduledStartAt
      ? INTERVIEW_STATUS.DRAFT
      : payload.status || INTERVIEW_STATUS.DRAFT;

  const interview = new Interview({
    organizationId,
    title: payload.title,
    description: payload.description || "",
    interviewType: payload.interviewType || "technical",
    candidate: payload.candidate || {},
    interviewerIds: validatedInterviewerIds,
    assessmentRef,
    questionSnapshots,
    scheduledStartAt,
    scheduledEndAt,
    durationMinutes,
    timezone: payload.timezone || "UTC",
    status,
    createdBy: user.id,
  });

  await interview.save();

  // Populate interviewers for serialization
  const interviewers = await User.find(
    { _id: { $in: validatedInterviewerIds } },
    { displayName: 1, email: 1 },
  ).lean();
  const interviewersMap = new Map(
    interviewers.map((u) => [String(u._id), u]),
  );

  return serializeInterview(interview, { interviewersMap });
}

export async function listInterviews(organizationId, query = {}) {
  const filter = { organizationId };

  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }

  if (query.interviewerId && mongoose.isValidObjectId(query.interviewerId)) {
    filter.interviewerIds = new mongoose.Types.ObjectId(query.interviewerId);
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), "i");
    filter.$or = [
      { title: searchRegex },
      { "candidate.name": searchRegex },
      { "candidate.email": searchRegex },
    ];
  }

  if (query.dateFrom || query.dateTo) {
    filter.scheduledStartAt = {};
    if (query.dateFrom) filter.scheduledStartAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.scheduledStartAt.$lte = new Date(query.dateTo);
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Interview.find(filter)
      .sort({ scheduledStartAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Interview.countDocuments(filter),
  ]);

  // Collect interviewer and interview IDs
  const allInterviewerIds = new Set();
  const interviewIds = items.map((i) => i._id);

  items.forEach((item) => {
    (item.interviewerIds || []).forEach((id) =>
      allInterviewerIds.add(String(id)),
    );
  });

  const [interviewers, invitations] = await Promise.all([
    User.find(
      { _id: { $in: Array.from(allInterviewerIds) } },
      { displayName: 1, email: 1 },
    ).lean(),
    CandidateInvitation.find({
      interviewId: { $in: interviewIds },
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const interviewersMap = new Map(
    interviewers.map((u) => [String(u._id), u]),
  );
  const invitationsByInterviewId = new Map();
  invitations.forEach((inv) => {
    const key = String(inv.interviewId);
    if (!invitationsByInterviewId.has(key)) {
      invitationsByInterviewId.set(key, inv);
    }
  });

  return {
    interviews: items.map((item) =>
      serializeInterview(item, {
        interviewersMap,
        invitation: invitationsByInterviewId.get(String(item._id)),
      }),
    ),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getInterview(organizationId, interviewId) {
  if (!mongoose.isValidObjectId(interviewId)) {
    throw notFound();
  }

  const interview = await Interview.findOne({
    _id: interviewId,
    organizationId,
  });

  if (!interview) {
    throw notFound();
  }

  const [interviewers, invitation] = await Promise.all([
    User.find(
      { _id: { $in: interview.interviewerIds || [] } },
      { displayName: 1, email: 1 },
    ).lean(),
    CandidateInvitation.findOne({
      interviewId: interview._id,
      organizationId,
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const interviewersMap = new Map(
    interviewers.map((u) => [String(u._id), u]),
  );

  return serializeInterview(interview, { interviewersMap, invitation });
}

export async function updateInterview(organizationId, interviewId, payload, user) {
  if (!mongoose.isValidObjectId(interviewId)) {
    throw notFound();
  }

  const interview = await Interview.findOne({
    _id: interviewId,
    organizationId,
  });

  if (!interview) {
    throw notFound();
  }

  if (
    interview.status === INTERVIEW_STATUS.COMPLETED ||
    interview.status === INTERVIEW_STATUS.CANCELLED
  ) {
    throw new AppError(
      `Cannot update an interview in '${interview.status}' status`,
      400,
      ERROR_CODES.INVALID_STATUS_TRANSITION,
    );
  }

  if (payload.title) interview.title = payload.title;
  if (payload.description !== undefined) interview.description = payload.description;
  if (payload.interviewType) interview.interviewType = payload.interviewType;
  if (payload.candidate) {
    interview.candidate = {
      ...interview.candidate.toObject(),
      ...payload.candidate,
    };
  }

  if (payload.interviewerIds) {
    interview.interviewerIds = await validateInterviewerMemberships(
      organizationId,
      payload.interviewerIds,
    );
  }

  if (payload.assessmentId !== undefined || payload.questions !== undefined) {
    const { assessmentRef, questionSnapshots } =
      await resolveQuestionSnapshots(organizationId, {
        assessmentId: payload.assessmentId,
        questions: payload.questions,
      });
    interview.assessmentRef = assessmentRef;
    interview.questionSnapshots = questionSnapshots;
  }

  if (payload.durationMinutes) interview.durationMinutes = payload.durationMinutes;
  if (payload.timezone) interview.timezone = payload.timezone;

  if (payload.scheduledStartAt) {
    interview.scheduledStartAt = payload.scheduledStartAt;
    if (payload.scheduledEndAt) {
      if (payload.scheduledEndAt <= payload.scheduledStartAt) {
        throw new AppError(
          "Scheduled end time must be after scheduled start time",
          400,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }
      interview.scheduledEndAt = payload.scheduledEndAt;
    } else {
      interview.scheduledEndAt = new Date(
        payload.scheduledStartAt.getTime() +
          interview.durationMinutes * 60000,
      );
    }
  }

  await interview.save();

  return getInterview(organizationId, interview._id);
}

export async function rescheduleInterview(
  organizationId,
  interviewId,
  { scheduledStartAt, scheduledEndAt, durationMinutes, timezone },
  user,
) {
  if (!mongoose.isValidObjectId(interviewId)) {
    throw notFound();
  }

  const interview = await Interview.findOne({
    _id: interviewId,
    organizationId,
  });

  if (!interview) {
    throw notFound();
  }

  if (
    interview.status !== INTERVIEW_STATUS.SCHEDULED &&
    interview.status !== INTERVIEW_STATUS.DRAFT
  ) {
    throw new AppError(
      `Cannot reschedule interview with status '${interview.status}'`,
      400,
      ERROR_CODES.INVALID_STATUS_TRANSITION,
    );
  }

  if (!scheduledStartAt) {
    throw new AppError(
      "Scheduled start time is required for rescheduling",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const duration = durationMinutes || interview.durationMinutes || 60;
  let endAt = scheduledEndAt;
  if (!endAt) {
    endAt = new Date(scheduledStartAt.getTime() + duration * 60000);
  } else if (endAt <= scheduledStartAt) {
    throw new AppError(
      "Scheduled end time must be after scheduled start time",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  interview.scheduledStartAt = scheduledStartAt;
  interview.scheduledEndAt = endAt;
  interview.durationMinutes = duration;
  if (timezone) interview.timezone = timezone;
  interview.status = INTERVIEW_STATUS.SCHEDULED;

  await interview.save();

  return getInterview(organizationId, interview._id);
}

export async function cancelInterview(organizationId, interviewId, reason, user) {
  if (!mongoose.isValidObjectId(interviewId)) {
    throw notFound();
  }

  const interview = await Interview.findOne({
    _id: interviewId,
    organizationId,
  });

  if (!interview) {
    throw notFound();
  }

  if (
    interview.status === INTERVIEW_STATUS.COMPLETED ||
    interview.status === INTERVIEW_STATUS.CANCELLED
  ) {
    throw new AppError(
      `Cannot cancel an interview already in '${interview.status}' status`,
      400,
      ERROR_CODES.INVALID_STATUS_TRANSITION,
    );
  }

  interview.status = INTERVIEW_STATUS.CANCELLED;
  await interview.save();

  // If there is an active candidate invitation, revoke it
  await CandidateInvitation.updateMany(
    {
      interviewId: interview._id,
      status: "pending",
    },
    {
      $set: { status: "revoked", revokedAt: new Date() },
    },
  );

  return getInterview(organizationId, interview._id);
}

export async function transitionInterviewStatus(
  organizationId,
  interviewId,
  targetStatus,
  user,
) {
  if (!mongoose.isValidObjectId(interviewId)) {
    throw notFound();
  }

  const interview = await Interview.findOne({
    _id: interviewId,
    organizationId,
  });

  if (!interview) {
    throw notFound();
  }

  const allowedTransitions = VALID_TRANSITIONS[interview.status] || [];
  if (!allowedTransitions.includes(targetStatus)) {
    throw new AppError(
      `Invalid status transition from '${interview.status}' to '${targetStatus}'`,
      400,
      ERROR_CODES.INVALID_STATUS_TRANSITION,
    );
  }

  interview.status = targetStatus;
  if (
    targetStatus === INTERVIEW_STATUS.IN_PROGRESS ||
    targetStatus === INTERVIEW_STATUS.LIVE
  ) {
    if (!interview.startedAt) interview.startedAt = new Date();
  } else if (targetStatus === INTERVIEW_STATUS.COMPLETED) {
    if (!interview.endedAt) interview.endedAt = new Date();
  }

  await interview.save();

  return getInterview(organizationId, interview._id);
}

export async function assignInterviewers(
  organizationId,
  interviewId,
  interviewerIds,
  user,
) {
  if (!mongoose.isValidObjectId(interviewId)) {
    throw notFound();
  }

  const interview = await Interview.findOne({
    _id: interviewId,
    organizationId,
  });

  if (!interview) {
    throw notFound();
  }

  const validatedIds = await validateInterviewerMemberships(
    organizationId,
    interviewerIds,
  );

  // Union with existing or replace
  const merged = new Set([
    ...interview.interviewerIds.map(String),
    ...validatedIds.map(String),
  ]);

  interview.interviewerIds = Array.from(merged).map(
    (id) => new mongoose.Types.ObjectId(id),
  );
  await interview.save();

  return getInterview(organizationId, interview._id);
}

export async function removeInterviewer(
  organizationId,
  interviewId,
  targetUserId,
  user,
) {
  if (!mongoose.isValidObjectId(interviewId)) {
    throw notFound();
  }

  const interview = await Interview.findOne({
    _id: interviewId,
    organizationId,
  });

  if (!interview) {
    throw notFound();
  }

  interview.interviewerIds = interview.interviewerIds.filter(
    (id) => String(id) !== String(targetUserId),
  );
  await interview.save();

  return getInterview(organizationId, interview._id);
}

export async function duplicateInterview(organizationId, interviewId, user) {
  if (!mongoose.isValidObjectId(interviewId)) {
    throw notFound();
  }

  const original = await Interview.findOne({
    _id: interviewId,
    organizationId,
  });

  if (!original) {
    throw notFound();
  }

  const duplicated = new Interview({
    organizationId,
    title: `Copy of ${original.title}`,
    description: original.description,
    interviewType: original.interviewType,
    candidate: {}, // candidate is deliberately cleared
    interviewerIds: original.interviewerIds,
    assessmentRef: original.assessmentRef,
    questionSnapshots: original.questionSnapshots,
    durationMinutes: original.durationMinutes,
    timezone: original.timezone,
    status: INTERVIEW_STATUS.DRAFT,
    createdBy: user.id,
  });

  await duplicated.save();

  return getInterview(organizationId, duplicated._id);
}
