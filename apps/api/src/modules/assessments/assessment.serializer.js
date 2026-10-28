import { buildQuestionSnapshot } from "../questions/question.serializer.js";

/**
 * Serialize an Assessment document.
 *
 * @param {any} assessment
 * @param {Map<string, any>} [questionsById]
 */
export function serializeAssessment(assessment, questionsById = new Map()) {
  const questionsList = (assessment.questions || []).map((item) => {
    const qDoc = questionsById.get(String(item.questionId));
    return {
      questionId: String(item.questionId),
      questionVersion: item.questionVersion,
      order: item.order,
      timeAllocationMinutes: item.timeAllocationMinutes,
      title: qDoc?.title || "Untitled Question",
      difficulty: qDoc?.difficulty || "medium",
      category: qDoc?.category || "data_structures_and_algorithms",
      questionType: qDoc?.questionType || "coding",
      supportedLanguages: qDoc?.supportedLanguages || [],
    };
  });

  return {
    id: String(assessment._id),
    organizationId: String(assessment.organizationId),
    title: assessment.title,
    description: assessment.description || "",
    questions: questionsList,
    totalDurationMinutes: assessment.totalDurationMinutes,
    difficultyDistribution: assessment.difficultyDistribution || {
      easy: 0,
      medium: 0,
      hard: 0,
    },
    version: assessment.version,
    status: assessment.status,
    createdBy: String(assessment.createdBy),
    createdAt: assessment.createdAt ? assessment.createdAt.toISOString() : null,
    updatedAt: assessment.updatedAt ? assessment.updatedAt.toISOString() : null,
  };
}

/**
 * Builds an immutable assessment snapshot with all frozen question snapshots.
 *
 * @param {any} assessment
 * @param {Map<string, any>} questionsById
 */
export function buildAssessmentSnapshot(assessment, questionsById) {
  const questionSnapshots = [];

  for (const item of assessment.questions || []) {
    const qDoc = questionsById.get(String(item.questionId));
    if (!qDoc) {
      throw new Error(`Referenced question ${item.questionId} not found`);
    }

    const qSnapshot = buildQuestionSnapshot(qDoc, item.questionVersion);
    questionSnapshots.push({
      ...qSnapshot,
      order: item.order,
      timeAllocationMinutes: item.timeAllocationMinutes,
    });
  }

  return {
    assessmentId: assessment._id,
    version: assessment.version,
    title: assessment.title,
    description: assessment.description || "",
    totalDurationMinutes: assessment.totalDurationMinutes,
    questionSnapshots,
  };
}
