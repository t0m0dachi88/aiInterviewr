export declare const ERROR_CODES: {
  readonly BAD_REQUEST: "BAD_REQUEST";
  readonly VALIDATION_ERROR: "VALIDATION_ERROR";
  readonly UNAUTHORIZED: "UNAUTHORIZED";
  readonly FORBIDDEN: "FORBIDDEN";
  readonly NOT_FOUND: "NOT_FOUND";
  readonly CONFLICT: "CONFLICT";
  readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
  readonly INTERNAL_ERROR: "INTERNAL_ERROR";
  readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
  readonly DATABASE_ERROR: "DATABASE_ERROR";
  readonly REDIS_ERROR: "REDIS_ERROR";
  readonly INVITATION_EXPIRED: "INVITATION_EXPIRED";
  readonly INVITATION_REVOKED: "INVITATION_REVOKED";
  readonly INTERVIEW_NOT_FOUND: "INTERVIEW_NOT_FOUND";
  readonly QUESTION_NOT_FOUND: "QUESTION_NOT_FOUND";
  readonly ASSESSMENT_NOT_FOUND: "ASSESSMENT_NOT_FOUND";
  readonly INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION";
  readonly CANDIDATE_INVITATION_NOT_FOUND: "CANDIDATE_INVITATION_NOT_FOUND";
  readonly CANDIDATE_INVITATION_EXPIRED: "CANDIDATE_INVITATION_EXPIRED";
  readonly CANDIDATE_INVITATION_REVOKED: "CANDIDATE_INVITATION_REVOKED";
  readonly CANDIDATE_INVITATION_ALREADY_RESOLVED: "CANDIDATE_INVITATION_ALREADY_RESOLVED";
  readonly EMAIL_MISMATCH: "EMAIL_MISMATCH";
};

export declare const ORG_ROLES: {
  readonly OWNER: "owner";
  readonly ADMIN: "admin";
  readonly INTERVIEWER: "interviewer";
};
export type OrgRole = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

export declare const INVITATION_STATUS: {
  readonly PENDING: "pending";
  readonly ACCEPTED: "accepted";
  readonly REVOKED: "revoked";
  readonly EXPIRED: "expired";
};
export type InvitationStatus =
  (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

export declare const USER_STATUS: {
  readonly ACTIVE: "active";
  readonly DISABLED: "disabled";
};
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export declare const SUPPORTED_LANGUAGES: readonly [
  "javascript",
  "python",
  "cpp",
];
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export declare const INTERVIEW_STATUS: {
  readonly DRAFT: "draft";
  readonly SCHEDULED: "scheduled";
  readonly WAITING: "waiting";
  readonly LIVE: "live";
  readonly IN_PROGRESS: "in_progress";
  readonly COMPLETED: "completed";
  readonly CANCELLED: "cancelled";
};
export type InterviewStatus =
  (typeof INTERVIEW_STATUS)[keyof typeof INTERVIEW_STATUS];

export declare const EXECUTION_STATUS: {
  readonly QUEUED: "queued";
  readonly RUNNING: "running";
  readonly PASSED: "passed";
  readonly FAILED: "failed";
  readonly COMPILE_ERROR: "compile_error";
  readonly RUNTIME_ERROR: "runtime_error";
  readonly TIME_LIMIT_EXCEEDED: "time_limit_exceeded";
  readonly MEMORY_LIMIT_EXCEEDED: "memory_limit_exceeded";
  readonly SYSTEM_ERROR: "system_error";
};
export type ExecutionStatus =
  (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

export declare const QUESTION_CATEGORIES: readonly {
  readonly id: string;
  readonly label: string;
}[];

export declare const QUESTION_DIFFICULTY: {
  readonly EASY: "easy";
  readonly MEDIUM: "medium";
  readonly HARD: "hard";
};
export type QuestionDifficulty =
  (typeof QUESTION_DIFFICULTY)[keyof typeof QUESTION_DIFFICULTY];

export declare const QUESTION_TYPE: {
  readonly CODING: "coding";
  readonly DEBUGGING: "debugging";
  readonly SYSTEM_DESIGN: "system_design";
  readonly CONCEPTUAL: "conceptual";
};
export type QuestionType = (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE];

export declare const QUESTION_STATUS: {
  readonly ACTIVE: "active";
  readonly ARCHIVED: "archived";
};
export type QuestionStatus =
  (typeof QUESTION_STATUS)[keyof typeof QUESTION_STATUS];

export declare const INTERVIEW_TYPE: {
  readonly TECHNICAL: "technical";
  readonly SYSTEM_DESIGN: "system_design";
  readonly CODING: "coding";
  readonly SCREENING: "screening";
};
export type InterviewType = (typeof INTERVIEW_TYPE)[keyof typeof INTERVIEW_TYPE];

export declare const CANDIDATE_INVITATION_STATUS: {
  readonly PENDING: "pending";
  readonly ACCEPTED: "accepted";
  readonly DECLINED: "declined";
  readonly REVOKED: "revoked";
  readonly EXPIRED: "expired";
};
export type CandidateInvitationStatus =
  (typeof CANDIDATE_INVITATION_STATUS)[keyof typeof CANDIDATE_INVITATION_STATUS];
