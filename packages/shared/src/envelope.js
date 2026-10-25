/**
 * Creates a standard API success envelope as specified in API_SPECIFICATION.md.
 *
 * @param {any} data - Payload data.
 * @param {Record<string, any>} [meta={}] - Optional metadata (pagination, timings, etc.).
 * @returns {{ success: true, data: any, meta: Record<string, any> }}
 */
export function createSuccessEnvelope(data = {}, meta = {}) {
  return {
    success: true,
    data,
    meta,
  };
}

/**
 * Creates a standard API error envelope as specified in API_SPECIFICATION.md.
 *
 * @param {string} code - Machine-readable error code.
 * @param {string} message - Human-readable error description.
 * @param {string} [requestId] - Unique request tracking ID.
 * @param {Record<string, any>} [details] - Optional safe error details (e.g. field errors).
 * @returns {{ success: false, error: { code: string, message: string, requestId?: string, details?: any } }}
 */
export function createErrorEnvelope(
  code,
  message,
  requestId = undefined,
  details = undefined,
) {
  const errorObj = {
    code,
    message,
  };

  if (requestId) {
    errorObj.requestId = requestId;
  }

  if (details && Object.keys(details).length > 0) {
    errorObj.details = details;
  }

  return {
    success: false,
    error: errorObj,
  };
}
