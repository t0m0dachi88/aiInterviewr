import type { ApiResponseEnvelope } from "@platform/shared";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export interface HealthLivenessData {
  status: string;
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

export interface HealthReadinessData {
  isReady: boolean;
  status: "ready" | "degraded";
  service: string;
  version: string;
  timestamp: string;
  dependencies: {
    database: {
      type: string;
      status: string;
      connected: boolean;
    };
    redis: {
      type: string;
      status: string;
      connected: boolean;
      latencyMs?: number;
      error?: string;
    };
  };
}

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, any>;
  requestId?: string;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, any>,
    requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
  }
}

/**
 * Fetch wrapper for standardized platform API requests.
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponseEnvelope<T>> {
  const url = `${API_BASE_URL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new ApiError(
        `Server returned non-JSON response with HTTP status ${response.status}`,
        "HTTP_ERROR",
        response.status,
      );
    }

    if (!response.ok) {
      const errorObj = data?.error;
      throw new ApiError(
        errorObj?.message || data?.message || `API request failed with status ${response.status}`,
        errorObj?.code || "HTTP_ERROR",
        response.status,
        errorObj?.details,
        errorObj?.requestId,
      );
    }

    return data as ApiResponseEnvelope<T>;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      err.message || "Network error occurred while communicating with API",
      "NETWORK_ERROR",
      0,
    );
  }
}

/**
 * Check backend service liveness.
 */
export async function getHealth(): Promise<HealthLivenessData> {
  const res = await fetchApi<HealthLivenessData>("/health");
  if (res.success) {
    return res.data;
  }
  throw new Error("Failed to retrieve health status");
}

/**
 * Check backend dependency readiness (MongoDB & Redis).
 */
export async function getReadiness(): Promise<HealthReadinessData> {
  const url = `${API_BASE_URL.replace(/\/+$/, "")}/health/ready`;
  const response = await fetch(url);
  const json: ApiResponseEnvelope<HealthReadinessData> = await response.json();

  if (json.success) {
    return json.data;
  }

  // If 503 degraded, dependencies are attached inside error.details
  return {
    isReady: false,
    status: "degraded",
    service: "@platform/api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    dependencies: (json as any).error?.details || {
      database: { type: "mongodb-atlas", status: "unknown", connected: false },
      redis: { type: "redis", status: "unknown", connected: false },
    },
  };
}
