import {
  QUESTION_DIFFICULTY,
  QUESTION_TYPE,
  QUESTION_STATUS,
  SUPPORTED_LANGUAGES,
} from "@platform/shared";
import { isNonEmptyString } from "../../middleware/validate.middleware.js";

export const questionValidators = {
  title(value) {
    return isNonEmptyString(value, "Title", { min: 3, max: 180 });
  },
  optionalTitle(value) {
    if (value === undefined || value === null) return { value: undefined };
    return isNonEmptyString(value, "Title", { min: 3, max: 180 });
  },
  category(value) {
    if (value === undefined || value === null || value === "") {
      return { value: "data_structures_and_algorithms" };
    }
    return isNonEmptyString(value, "Category", { min: 2, max: 80 });
  },
  optionalCategory(value) {
    if (value === undefined || value === null) return { value: undefined };
    return isNonEmptyString(value, "Category", { min: 2, max: 80 });
  },
  difficulty(value) {
    if (!value || !Object.values(QUESTION_DIFFICULTY).includes(value)) {
      return { error: `Difficulty must be one of: ${Object.values(QUESTION_DIFFICULTY).join(", ")}` };
    }
    return { value };
  },
  optionalDifficulty(value) {
    if (value === undefined || value === null) return { value: undefined };
    if (!Object.values(QUESTION_DIFFICULTY).includes(value)) {
      return { error: `Difficulty must be one of: ${Object.values(QUESTION_DIFFICULTY).join(", ")}` };
    }
    return { value };
  },
  questionType(value) {
    if (!value) return { value: QUESTION_TYPE.CODING };
    if (!Object.values(QUESTION_TYPE).includes(value)) {
      return { error: `Question type must be one of: ${Object.values(QUESTION_TYPE).join(", ")}` };
    }
    return { value };
  },
  optionalQuestionType(value) {
    if (value === undefined || value === null) return { value: undefined };
    if (!Object.values(QUESTION_TYPE).includes(value)) {
      return { error: `Question type must be one of: ${Object.values(QUESTION_TYPE).join(", ")}` };
    }
    return { value };
  },
  statement(value) {
    return isNonEmptyString(value, "Problem statement", { min: 5, max: 20000 });
  },
  optionalStatement(value) {
    if (value === undefined || value === null) return { value: undefined };
    return isNonEmptyString(value, "Problem statement", { min: 5, max: 20000 });
  },
  tags(value) {
    if (value === undefined || value === null) return { value: [] };
    if (!Array.isArray(value)) return { error: "Tags must be an array of strings" };
    const cleaned = value
      .filter((t) => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim().toLowerCase())
      .slice(0, 20);
    return { value: cleaned };
  },
  expectedDurationMinutes(value) {
    if (value === undefined || value === null || value === "") return { value: 30 };
    const num = Number(value);
    if (Number.isNaN(num) || num < 5 || num > 300) {
      return { error: "Expected duration must be between 5 and 300 minutes" };
    }
    return { value: Math.round(num) };
  },
  optionalExpectedDurationMinutes(value) {
    if (value === undefined || value === null) return { value: undefined };
    const num = Number(value);
    if (Number.isNaN(num) || num < 5 || num > 300) {
      return { error: "Expected duration must be between 5 and 300 minutes" };
    }
    return { value: Math.round(num) };
  },
  constraints(value) {
    if (value === undefined || value === null) return { value: [] };
    if (!Array.isArray(value)) return { error: "Constraints must be an array of strings" };
    const cleaned = value
      .filter((c) => typeof c === "string" && c.trim().length > 0)
      .map((c) => c.trim())
      .slice(0, 30);
    return { value: cleaned };
  },
  examples(value) {
    if (value === undefined || value === null) return { value: [] };
    if (!Array.isArray(value)) return { error: "Examples must be an array" };
    const cleaned = [];
    for (const ex of value) {
      if (typeof ex !== "object" || !ex) continue;
      if (typeof ex.input !== "string" || typeof ex.output !== "string") {
        return { error: "Each example must have input and output strings" };
      }
      cleaned.push({
        input: ex.input,
        output: ex.output,
        explanation: typeof ex.explanation === "string" ? ex.explanation : "",
      });
    }
    return { value: cleaned };
  },
  allowedLanguages(value) {
    if (value === undefined || value === null) return { value: [...SUPPORTED_LANGUAGES] };
    if (!Array.isArray(value)) return { error: "Allowed languages must be an array" };
    const valid = value.filter((lang) => SUPPORTED_LANGUAGES.includes(lang));
    if (valid.length === 0) {
      return { error: `Must include at least one supported language (${SUPPORTED_LANGUAGES.join(", ")})` };
    }
    return { value: valid };
  },
  starterCodeByLanguage(value) {
    if (value === undefined || value === null) return { value: {} };
    if (typeof value !== "object" || Array.isArray(value)) {
      return { error: "Starter code must be an object keyed by language" };
    }
    const cleaned = {};
    for (const [lang, code] of Object.entries(value)) {
      if (typeof code === "string") {
        cleaned[lang] = code;
      }
    }
    return { value: cleaned };
  },
  publicTests(value) {
    if (value === undefined || value === null) return { value: [] };
    if (!Array.isArray(value)) return { error: "Public tests must be an array" };
    const cleaned = [];
    for (const test of value) {
      if (!test || typeof test.input !== "string" || typeof test.expectedOutput !== "string") {
        return { error: "Each test case must include input and expectedOutput strings" };
      }
      cleaned.push({
        input: test.input,
        expectedOutput: test.expectedOutput,
      });
    }
    return { value: cleaned };
  },
  hiddenTests(value) {
    if (value === undefined || value === null) return { value: [] };
    if (!Array.isArray(value)) return { error: "Hidden tests must be an array" };
    const cleaned = [];
    for (const test of value) {
      if (!test || typeof test.input !== "string" || typeof test.expectedOutput !== "string") {
        return { error: "Each test case must include input and expectedOutput strings" };
      }
      cleaned.push({
        input: test.input,
        expectedOutput: test.expectedOutput,
      });
    }
    return { value: cleaned };
  },
  timeLimitMs(value) {
    if (value === undefined || value === null || value === "") return { value: 2000 };
    const num = Number(value);
    if (Number.isNaN(num) || num < 100 || num > 30000) {
      return { error: "Time limit must be between 100ms and 30000ms" };
    }
    return { value: Math.round(num) };
  },
  memoryLimitMb(value) {
    if (value === undefined || value === null || value === "") return { value: 256 };
    const num = Number(value);
    if (Number.isNaN(num) || num < 16 || num > 1024) {
      return { error: "Memory limit must be between 16MB and 1024MB" };
    }
    return { value: Math.round(num) };
  },
  changeSummary(value) {
    if (value === undefined || value === null) return { value: "" };
    if (typeof value !== "string") return { error: "Change summary must be a string" };
    return { value: value.trim().slice(0, 255) };
  },
};
