import { createSuccessEnvelope, createErrorEnvelope } from "@platform/shared";

/**
 * Send a standardized API success response.
 *
 * @param {import('express').Response} res
 * @param {any} data
 * @param {Record<string, any>} [meta={}]
 * @param {number} [statusCode=200]
 */
export function sendSuccess(res, data = {}, meta = {}, statusCode = 200) {
  return res.status(statusCode).json(createSuccessEnvelope(data, meta));
}

/**
 * Send a standardized API error response.
 *
 * @param {import('express').Response} res
 * @param {string} code
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {Record<string, any>} [details]
 */
export function sendError(
  res,
  code,
  message,
  statusCode = 500,
  details = undefined,
) {
  const requestId = res.req?.id;
  return res
    .status(statusCode)
    .json(createErrorEnvelope(code, message, requestId, details));
}
