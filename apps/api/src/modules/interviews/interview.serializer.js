/**
 * Formats question snapshot starter code from Map to object.
 */
function serializeQuestionSnapshot(q, { includeHiddenTests = true } = {}) {
  let starterCode = {};
  if (q.starterCodeByLanguage) {
    if (typeof q.starterCodeByLanguage.get === "function") {
      for (const [k, v] of q.starterCodeByLanguage.entries()) {
        starterCode[k] = v;
      }
    } else {
      starterCode = { ...q.starterCodeByLanguage };
    }
  }

  const result = {
    questionId: String(q.questionId),
    version: q.version,
    title: q.title,
    statement: q.statement,
    constraints: q.constraints || [],
    examples: (q.examples || []).map((ex) => ({
      input: ex.input,
      output: ex.output,
      explanation: ex.explanation || "",
    })),
    allowedLanguages: q.allowedLanguages || [],
    starterCodeByLanguage: starterCode,
    publicTests: (q.publicTests || []).map((t) => ({
      input: t.input,
      expectedOutput: t.expectedOutput,
    })),
    timeLimitMs: q.timeLimitMs,
    memoryLimitMb: q.memoryLimitMb,
    order: q.order || 1,
    timeAllocationMinutes: q.timeAllocationMinutes || 30,
  };

  if (includeHiddenTests) {
    result.hiddenTests = (q.hiddenTests || []).map((t) => ({
      input: t.input,
      expectedOutput: t.expectedOutput,
    }));
  }

  return result;
}

/**
 * Serialize an Interview document for authorized internal users (owners, admins, interviewers).
 *
 * @param {any} interview
 * @param {{ interviewersMap?: Map<string, any>, invitation?: any, includeHiddenTests?: boolean }} [options]
 */
export function serializeInterview(interview, options = {}) {
  const {
    interviewersMap = new Map(),
    invitation = null,
    includeHiddenTests = true,
  } = options;

  const interviewers = (interview.interviewerIds || []).map((id) => {
    const idStr = String(id);
    const u = interviewersMap.get(idStr);
    return {
      id: idStr,
      displayName: u?.displayName || u?.name || "Interviewer",
      email: u?.email || "",
    };
  });

  return {
    id: String(interview._id),
    organizationId: String(interview.organizationId),
    title: interview.title,
    description: interview.description || "",
    interviewType: interview.interviewType,
    candidate: {
      userId: interview.candidate?.userId
        ? String(interview.candidate.userId)
        : null,
      name: interview.candidate?.name || "",
      email: interview.candidate?.email || "",
      externalRef: interview.candidate?.externalRef || "",
    },
    interviewerIds: (interview.interviewerIds || []).map(String),
    interviewers,
    assessment: interview.assessmentRef?.assessmentId
      ? {
          assessmentId: String(interview.assessmentRef.assessmentId),
          version: interview.assessmentRef.version,
          title: interview.assessmentRef.title,
        }
      : null,
    questionSnapshots: (interview.questionSnapshots || []).map((q) =>
      serializeQuestionSnapshot(q, { includeHiddenTests }),
    ),
    scheduledStartAt: interview.scheduledStartAt
      ? interview.scheduledStartAt.toISOString()
      : null,
    scheduledEndAt: interview.scheduledEndAt
      ? interview.scheduledEndAt.toISOString()
      : null,
    durationMinutes: interview.durationMinutes,
    timezone: interview.timezone || "UTC",
    status: interview.status,
    invitationStatus: invitation ? invitation.status : "none",
    invitation: invitation
      ? {
          id: String(invitation._id),
          status: invitation.status,
          expiresAt: invitation.expiresAt
            ? invitation.expiresAt.toISOString()
            : null,
          acceptedAt: invitation.acceptedAt
            ? invitation.acceptedAt.toISOString()
            : null,
        }
      : null,
    startedAt: interview.startedAt ? interview.startedAt.toISOString() : null,
    endedAt: interview.endedAt ? interview.endedAt.toISOString() : null,
    createdBy: String(interview.createdBy),
    createdAt: interview.createdAt ? interview.createdAt.toISOString() : null,
    updatedAt: interview.updatedAt ? interview.updatedAt.toISOString() : null,
  };
}

/**
 * Candidate-safe DTO. Excludes interviewer ids, internal notes, hidden test cases.
 *
 * @param {any} interview
 * @param {{ organizationName?: string, invitationStatus?: string }} [options]
 */
export function serializeCandidateInterview(interview, options = {}) {
  return {
    id: String(interview._id),
    title: interview.title,
    description: interview.description || "",
    interviewType: interview.interviewType,
    organizationName: options.organizationName || "Hiring Team",
    candidateName: interview.candidate?.name || "",
    scheduledStartAt: interview.scheduledStartAt
      ? interview.scheduledStartAt.toISOString()
      : null,
    scheduledEndAt: interview.scheduledEndAt
      ? interview.scheduledEndAt.toISOString()
      : null,
    durationMinutes: interview.durationMinutes,
    timezone: interview.timezone || "UTC",
    status: interview.status,
    invitationStatus: options.invitationStatus || "pending",
  };
}
