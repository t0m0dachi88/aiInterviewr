import mongoose from "mongoose";
import { isNonEmptyString } from "../../middleware/validate.middleware.js";

export const assessmentValidators = {
  title(value) {
    return isNonEmptyString(value, "Title", { min: 3, max: 180 });
  },
  optionalTitle(value) {
    if (value === undefined || value === null) return { value: undefined };
    return isNonEmptyString(value, "Title", { min: 3, max: 180 });
  },
  description(value) {
    if (value === undefined || value === null) return { value: "" };
    if (typeof value !== "string") return { error: "Description must be a string" };
    return { value: value.trim().slice(0, 2000) };
  },
  questions(value) {
    if (value === undefined || value === null) return { value: [] };
    if (!Array.isArray(value)) return { error: "Questions must be an array" };

    const cleaned = [];
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (!item || typeof item !== "object") {
        return { error: `Invalid question configuration at index ${i}` };
      }
      if (!mongoose.isValidObjectId(item.questionId)) {
        return { error: `Invalid question ID at index ${i}` };
      }
      const version = Number(item.questionVersion) || 1;
      const order = Number(item.order) || i + 1;
      const timeAllocation = Number(item.timeAllocationMinutes) || 30;

      if (timeAllocation < 1 || timeAllocation > 300) {
        return { error: `Time allocation for question at index ${i} must be between 1 and 300 minutes` };
      }

      cleaned.push({
        questionId: item.questionId,
        questionVersion: version,
        order,
        timeAllocationMinutes: timeAllocation,
      });
    }

    return { value: cleaned };
  },
  totalDurationMinutes(value) {
    if (value === undefined || value === null || value === "") return { value: undefined };
    const num = Number(value);
    if (Number.isNaN(num) || num < 5 || num > 600) {
      return { error: "Total duration must be between 5 and 600 minutes" };
    }
    return { value: Math.round(num) };
  },
};
