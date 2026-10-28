import { ERROR_CODES } from "@platform/shared";
import { AppError } from "./error.middleware.js";

/**
 * @typedef {(value: any) => { error?: string, value?: any }} FieldValidator
 */

/**
 * Validate and sanitize request body fields.
 *
 * @param {Record<string, FieldValidator>} fields
 */
export function validateBody(fields) {
  return (req, _res, next) => {
    const details = {};
    const sanitized = {};
    const body = req.body && typeof req.body === "object" ? req.body : {};

    for (const [name, rule] of Object.entries(fields)) {
      const result = rule(body[name]);
      if (result.error) {
        details[name] = result.error;
      } else {
        sanitized[name] = result.value;
      }
    }

    if (Object.keys(details).length > 0) {
      return next(
        new AppError(
          "Request validation failed",
          400,
          ERROR_CODES.VALIDATION_ERROR,
          { fields: details },
        ),
      );
    }

    req.validated = { ...(req.validated || {}), ...sanitized };
    next();
  };
}

export const isNonEmptyString = (value, label, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string") {
    return { error: `${label} is required` };
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    return {
      error: `${label} must be between ${min} and ${max} characters`,
    };
  }
  return { value: trimmed };
};

export const validators = {
  displayName(value) {
    return isNonEmptyString(value, "Name", { min: 1, max: 80 });
  },
  email(value) {
    if (typeof value !== "string") {
      return { error: "Email is required" };
    }
    const normalized = value.trim().toLowerCase();
    if (
      normalized.length < 3 ||
      normalized.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ) {
      return { error: "A valid email address is required" };
    }
    return { value: normalized };
  },
  password(value) {
    if (typeof value !== "string") {
      return { error: "Password is required" };
    }
    if (value.length < 8 || value.length > 128) {
      return { error: "Password must be between 8 and 128 characters" };
    }
    if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
      return {
        error: "Password must include uppercase, lowercase, and a number",
      };
    }
    return { value };
  },
  loginPassword(value) {
    if (typeof value !== "string" || value.length < 1) {
      return { error: "Password is required" };
    }
    return { value };
  },
  organizationName(value) {
    return isNonEmptyString(value, "Organization name", { min: 2, max: 80 });
  },
  optionalOrganizationName(value) {
    if (value === undefined || value === null) {
      return { value: undefined };
    }
    return isNonEmptyString(value, "Organization name", { min: 2, max: 80 });
  },
  membershipId(value) {
    return isNonEmptyString(value, "Membership ID", { min: 1, max: 64 });
  },
  optionalSlug(value) {
    if (value === undefined || value === null || value === "") {
      return { value: undefined };
    }
    if (typeof value !== "string") {
      return { error: "Slug must be a string" };
    }
    const slug = value.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 60) {
      return {
        error: "Slug may contain lowercase letters, numbers, and hyphens only",
      };
    }
    return { value: slug };
  },
  invitationToken(value) {
    if (typeof value !== "string" || value.trim().length < 16) {
      return { error: "Invitation token is required" };
    }
    return { value: value.trim() };
  },
  invitedRole(value) {
    if (value !== "admin" && value !== "interviewer") {
      return { error: "Invited role must be admin or interviewer" };
    }
    return { value };
  },
  membershipRole(value) {
    if (value !== "admin" && value !== "interviewer") {
      return { error: "Role must be admin or interviewer" };
    }
    return { value };
  },
};
