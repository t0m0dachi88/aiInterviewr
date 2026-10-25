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
  COMPLETED: "completed",
  CANCELLED: "cancelled",
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
