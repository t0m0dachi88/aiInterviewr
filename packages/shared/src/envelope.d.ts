export interface ApiSuccessEnvelope<T = any> {
  success: true;
  data: T;
  meta: Record<string, any>;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  requestId?: string;
  details?: Record<string, any>;
}

export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponseEnvelope<T = any> =
  ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export declare function createSuccessEnvelope<T = any>(
  data?: T,
  meta?: Record<string, any>,
): ApiSuccessEnvelope<T>;

export declare function createErrorEnvelope(
  code: string,
  message: string,
  requestId?: string,
  details?: Record<string, any>,
): ApiErrorEnvelope;
