import mongoose from "mongoose";
import {
  INTERVIEW_STATUS,
  INTERVIEW_TYPE,
} from "@platform/shared";
import { isNonEmptyString, validators } from "../../middleware/validate.middleware.js";

function isValidTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const interviewValidators = {
  title(value) {
    return isNonEmptyString(value, "Interview title", { min: 3, max: 180 });
  },
  optionalTitle(value) {
    if (value === undefined || value === null) return { value: undefined };
    return isNonEmptyString(value, "Interview title", { min: 3, max: 180 });
  },
  description(value) {
    if (value === undefined || value === null) return { value: "" };
    if (typeof value !== "string") return { error: "Description must be a string" };
    return { value: value.trim().slice(0, 3000) };
  },
  interviewType(value) {
    if (!value) return { value: INTERVIEW_TYPE.TECHNICAL };
    if (!Object.values(INTERVIEW_TYPE).includes(value)) {
      return { error: `Interview type must be one of: ${Object.values(INTERVIEW_TYPE).join(", ")}` };
    }
    return { value };
  },
  candidate(value) {
    if (value === undefined || value === null) return { value: {} };
    if (typeof value !== "object" || Array.isArray(value)) {
      return { error: "Candidate must be an object with name and email" };
    }
    const name = typeof value.name === "string" ? value.name.trim() : "";
    const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
    const externalRef = typeof value.externalRef === "string" ? value.externalRef.trim() : "";

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Candidate email must be a valid email address" };
    }

    return { value: { name, email, externalRef } };
  },
  interviewerIds(value) {
    if (value === undefined || value === null) return { value: [] };
    if (!Array.isArray(value)) return { error: "Interviewer IDs must be an array" };
    for (const id of value) {
      if (!mongoose.isValidObjectId(id)) {
        return { error: `Invalid interviewer ID: ${id}` };
      }
    }
    return { value: value.map(String) };
  },
  assessmentId(value) {
    if (value === undefined || value === null || value === "") return { value: null };
    if (!mongoose.isValidObjectId(value)) {
      return { error: "Assessment ID must be a valid ObjectId" };
    }
    return { value: String(value) };
  },
  questions(value) {
    if (value === undefined || value === null) return { value: undefined };
    if (!Array.isArray(value)) return { error: "Questions must be an array" };
    for (let i = 0; i < value.length; i++) {
      const q = value[i];
      if (!q || !mongoose.isValidObjectId(q.questionId)) {
        return { error: `Invalid questionId at index ${i}` };
      }
    }
    return { value };
  },
  scheduledStartAt(value) {
    if (value === undefined || value === null || value === "") return { value: null };
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return { error: "Scheduled start time must be a valid ISO date string" };
    }
    return { value: date };
  },
  scheduledEndAt(value) {
    if (value === undefined || value === null || value === "") return { value: null };
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return { error: "Scheduled end time must be a valid ISO date string" };
    }
    return { value: date };
  },
  durationMinutes(value) {
    if (value === undefined || value === null || value === "") return { value: 60 };
    const num = Number(value);
    if (Number.isNaN(num) || num < 5 || num > 600) {
      return { error: "Duration must be between 5 and 600 minutes" };
    }
    return { value: Math.round(num) };
  },
  timezone(value) {
    if (value === undefined || value === null || value === "") return { value: "UTC" };
    if (typeof value !== "string" || !isValidTimezone(value.trim())) {
      return { error: "Timezone must be a valid IANA timezone (e.g., 'America/New_York', 'UTC')" };
    }
    return { value: value.trim() };
  },
  status(value) {
    if (!value) return { value: INTERVIEW_STATUS.DRAFT };
    if (!Object.values(INTERVIEW_STATUS).includes(value)) {
      return { error: `Status must be one of: ${Object.values(INTERVIEW_STATUS).join(", ")}` };
    }
    return { value };
  },
  transitionStatus(value) {
    if (!value || !Object.values(INTERVIEW_STATUS).includes(value)) {
      return { error: `Target status must be one of: ${Object.values(INTERVIEW_STATUS).join(", ")}` };
    }
    return { value };
  },
};
