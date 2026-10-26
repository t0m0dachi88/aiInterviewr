/**
 * Standard error codes used across backend and frontend.
 */
export const ERROR_CODES = Object.freeze({
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",
  REDIS_ERROR: "REDIS_ERROR",
  INVITATION_EXPIRED: "INVITATION_EXPIRED",
  INVITATION_REVOKED: "INVITATION_REVOKED",
  INTERVIEW_NOT_FOUND: "INTERVIEW_NOT_FOUND",
  QUESTION_NOT_FOUND: "QUESTION_NOT_FOUND",
  ASSESSMENT_NOT_FOUND: "ASSESSMENT_NOT_FOUND",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  CANDIDATE_INVITATION_NOT_FOUND: "CANDIDATE_INVITATION_NOT_FOUND",
  CANDIDATE_INVITATION_EXPIRED: "CANDIDATE_INVITATION_EXPIRED",
  CANDIDATE_INVITATION_REVOKED: "CANDIDATE_INVITATION_REVOKED",
  CANDIDATE_INVITATION_ALREADY_RESOLVED: "CANDIDATE_INVITATION_ALREADY_RESOLVED",
  EMAIL_MISMATCH: "EMAIL_MISMATCH",
});

/**
 * Organization membership roles.
 */
export const ORG_ROLES = Object.freeze({
  OWNER: "owner",
  ADMIN: "admin",
  INTERVIEWER: "interviewer",
});

/**
 * Invitation lifecycle statuses.
 */
export const INVITATION_STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  REVOKED: "revoked",
  EXPIRED: "expired",
});

/**
 * User account statuses.
 */
export const USER_STATUS = Object.freeze({
  ACTIVE: "active",
  DISABLED: "disabled",
});

/**
 * Supported programming languages for code execution.
 */
export const SUPPORTED_LANGUAGES = Object.freeze([
  "javascript",
  "python",
  "cpp",
]);

/**
 * Standard interview lifecycle statuses.
 */
export const INTERVIEW_STATUS = Object.freeze({
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  WAITING: "waiting",
  LIVE: "live",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
});

/**
 * Question categories.
 */
export const QUESTION_CATEGORIES = Object.freeze([
  { id: "data_structures_and_algorithms", label: "Data Structures & Algorithms" },
  { id: "backend_engineering", label: "Backend Engineering" },
  { id: "frontend_engineering", label: "Frontend Engineering" },
  { id: "databases", label: "Databases" },
  { id: "system_design", label: "System Design" },
  { id: "debugging", label: "Debugging" },
  { id: "programming_fundamentals", label: "Programming Fundamentals" },
]);

export const QUESTION_DIFFICULTY = Object.freeze({
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
});

export const QUESTION_TYPE = Object.freeze({
  CODING: "coding",
  DEBUGGING: "debugging",
  SYSTEM_DESIGN: "system_design",
  CONCEPTUAL: "conceptual",
});

export const QUESTION_STATUS = Object.freeze({
  ACTIVE: "active",
  ARCHIVED: "archived",
});

export const INTERVIEW_TYPE = Object.freeze({
  TECHNICAL: "technical",
  SYSTEM_DESIGN: "system_design",
  CODING: "coding",
  SCREENING: "screening",
});

export const CANDIDATE_INVITATION_STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  REVOKED: "revoked",
  EXPIRED: "expired",
});

/**
 * Normalized code execution outcome statuses.
 */
export const EXECUTION_STATUS = Object.freeze({
  QUEUED: "queued",
  RUNNING: "running",
  PASSED: "passed",
  FAILED: "failed",
  COMPILE_ERROR: "compile_error",
  RUNTIME_ERROR: "runtime_error",
  TIME_LIMIT_EXCEEDED: "time_limit_exceeded",
  MEMORY_LIMIT_EXCEEDED: "memory_limit_exceeded",
  SYSTEM_ERROR: "system_error",
});
