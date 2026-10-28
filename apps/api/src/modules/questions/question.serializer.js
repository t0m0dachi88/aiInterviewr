/**
 * Serialize a Question document for API output.
 *
 * @param {any} question
 * @param {{ includeHiddenTests?: boolean, version?: number, includeHistory?: boolean }} [options]
 */
export function serializeQuestion(question, options = {}) {
  const {
    includeHiddenTests = false,
    version = null,
    includeHistory = false,
  } = options;

  const targetVersionNum = version ? Number(version) : question.currentVersion;
  const versionsList = question.versions || [];
  const versionData =
    versionsList.find((v) => v.version === targetVersionNum) ||
    versionsList[versionsList.length - 1] ||
    {};

  // Convert starterCodeByLanguage Map to plain object if needed
  let starterCode = {};
  if (versionData.starterCodeByLanguage) {
    if (typeof versionData.starterCodeByLanguage.get === "function") {
      for (const [k, v] of versionData.starterCodeByLanguage.entries()) {
        starterCode[k] = v;
      }
    } else {
      starterCode = { ...versionData.starterCodeByLanguage };
    }
  }

  const result = {
    id: String(question._id),
    organizationId: String(question.organizationId),
    title: question.title,
    slug: question.slug,
    category: question.category,
    difficulty: question.difficulty,
    tags: question.tags || [],
    expectedDurationMinutes: question.expectedDurationMinutes,
    questionType: question.questionType,
    supportedLanguages: question.supportedLanguages || [],
    status: question.status,
    currentVersion: question.currentVersion,
    activeVersion: versionData.version || question.currentVersion,
    statement: versionData.statement || "",
    constraints: versionData.constraints || [],
    examples: (versionData.examples || []).map((ex) => ({
      input: ex.input,
      output: ex.output,
      explanation: ex.explanation || "",
    })),
    allowedLanguages: versionData.allowedLanguages || question.supportedLanguages || [],
    starterCodeByLanguage: starterCode,
    publicTests: (versionData.publicTests || []).map((t) => ({
      input: t.input,
      expectedOutput: t.expectedOutput,
    })),
    timeLimitMs: versionData.timeLimitMs ?? 2000,
    memoryLimitMb: versionData.memoryLimitMb ?? 256,
    createdBy: String(question.createdBy),
    createdAt: question.createdAt ? question.createdAt.toISOString() : null,
    updatedAt: question.updatedAt ? question.updatedAt.toISOString() : null,
    archivedAt: question.archivedAt ? question.archivedAt.toISOString() : null,
  };

  if (includeHiddenTests) {
    result.hiddenTests = (versionData.hiddenTests || []).map((t) => ({
      input: t.input,
      expectedOutput: t.expectedOutput,
    }));
  }

  if (includeHistory) {
    result.versions = (question.versions || []).map((v) => ({
      version: v.version,
      title: v.title,
      changeSummary: v.changeSummary || "",
      createdBy: String(v.createdBy),
      createdAt: v.createdAt ? v.createdAt.toISOString() : null,
    }));
  }

  return result;
}

/**
 * Builds an immutable question snapshot suitable for embedding in assessments and interviews.
 *
 * @param {any} question
 * @param {number} [targetVersion]
 */
export function buildQuestionSnapshot(question, targetVersion = null) {
  const versionNum = targetVersion
    ? Number(targetVersion)
    : question.currentVersion;
  const versionData =
    (question.versions || []).find((v) => v.version === versionNum) ||
    question.versions?.[question.versions.length - 1];

  if (!versionData) {
    throw new Error(`Question version ${versionNum} not found`);
  }

  let starterCode = {};
  if (versionData.starterCodeByLanguage) {
    if (typeof versionData.starterCodeByLanguage.get === "function") {
      for (const [k, v] of versionData.starterCodeByLanguage.entries()) {
        starterCode[k] = v;
      }
    } else {
      starterCode = { ...versionData.starterCodeByLanguage };
    }
  }

  return {
    questionId: question._id,
    version: versionData.version,
    title: versionData.title || question.title,
    statement: versionData.statement,
    constraints: versionData.constraints || [],
    examples: (versionData.examples || []).map((ex) => ({
      input: ex.input,
      output: ex.output,
      explanation: ex.explanation || "",
    })),
    allowedLanguages: versionData.allowedLanguages || question.supportedLanguages || [],
    starterCodeByLanguage: starterCode,
    publicTests: (versionData.publicTests || []).map((t) => ({
      input: t.input,
      expectedOutput: t.expectedOutput,
    })),
    hiddenTests: (versionData.hiddenTests || []).map((t) => ({
      input: t.input,
      expectedOutput: t.expectedOutput,
    })),
    timeLimitMs: versionData.timeLimitMs ?? 2000,
    memoryLimitMb: versionData.memoryLimitMb ?? 256,
  };
}
