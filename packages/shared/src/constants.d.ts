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
};

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
