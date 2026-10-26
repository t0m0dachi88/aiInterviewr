import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { connectTestDb, clearTestDb, disconnectTestDb } from "../test/db.js";
import { Assessment } from "../modules/assessments/assessment.model.js";

async function createTestUser({ name, email, password = "Password123!" }) {
  const res = await request(app).post("/api/v1/auth/register").send({
    name,
    email,
    password,
  });
  return {
    user: res.body.data.user,
    token: res.body.data.accessToken,
  };
}

async function createTestOrg(ownerToken, name = "Acme Corp") {
  const res = await request(app)
    .post("/api/v1/organizations")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ name });
  return res.body.data.organization;
}

async function createTestQuestion(token, orgId, title, difficulty = "easy") {
  const res = await request(app)
    .post(`/api/v1/organizations/${orgId}/questions`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      title,
      difficulty,
      statement: `Statement for ${title}`,
      expectedDurationMinutes: 20,
    });
  return res.body.data.question;
}

describe("Assessment Design API (/api/v1/organizations/:organizationId/assessments)", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it("creates an assessment with questions and computes difficulty distribution", async () => {
    const owner = await createTestUser({
      name: "Owner A",
      email: "owner_a@test.com",
    });
    const org = await createTestOrg(owner.token);

    const q1 = await createTestQuestion(owner.token, org.id, "Easy Problem", "easy");
    const q2 = await createTestQuestion(owner.token, org.id, "Hard Problem", "hard");

    const res = await request(app)
      .post(`/api/v1/organizations/${org.id}/assessments`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Frontend Senior Assessment",
        description: "Assesses algorithms and problem solving",
        questions: [
          {
            questionId: q1.id,
            questionVersion: 1,
            order: 1,
            timeAllocationMinutes: 20,
          },
          {
            questionId: q2.id,
            questionVersion: 1,
            order: 2,
            timeAllocationMinutes: 40,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const assessment = res.body.data.assessment;
    expect(assessment.title).toBe("Frontend Senior Assessment");
    expect(assessment.version).toBe(1);
    expect(assessment.totalDurationMinutes).toBe(60);
    expect(assessment.difficultyDistribution).toEqual({
      easy: 1,
      medium: 0,
      hard: 1,
    });
    expect(assessment.questions).toHaveLength(2);
    expect(assessment.questions[0].title).toBe("Easy Problem");
  });

  it("increments assessment version and updates question configurations", async () => {
    const owner = await createTestUser({
      name: "Owner B",
      email: "owner_b@test.com",
    });
    const org = await createTestOrg(owner.token);

    const q1 = await createTestQuestion(owner.token, org.id, "Question One", "easy");
    const q2 = await createTestQuestion(owner.token, org.id, "Question Two", "medium");

    const createRes = await request(app)
      .post(`/api/v1/organizations/${org.id}/assessments`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Initial Assessment",
        questions: [
          { questionId: q1.id, questionVersion: 1, order: 1, timeAllocationMinutes: 30 },
        ],
      });

    const assessmentId = createRes.body.data.assessment.id;
    expect(createRes.body.data.assessment.version).toBe(1);

    // Update assessment: add Q2 and change order
    const updateRes = await request(app)
      .patch(`/api/v1/organizations/${org.id}/assessments/${assessmentId}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Updated Assessment Template",
        questions: [
          { questionId: q2.id, questionVersion: 1, order: 1, timeAllocationMinutes: 25 },
          { questionId: q1.id, questionVersion: 1, order: 2, timeAllocationMinutes: 25 },
        ],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.assessment.version).toBe(2);
    expect(updateRes.body.data.assessment.questions).toHaveLength(2);
    expect(updateRes.body.data.assessment.questions[0].title).toBe("Question Two");
  });

  it("rejects questions from another organization (cross-tenant rejection)", async () => {
    const userA = await createTestUser({
      name: "User A",
      email: "usera_assess@test.com",
    });
    const userB = await createTestUser({
      name: "User B",
      email: "userb_assess@test.com",
    });

    const orgA = await createTestOrg(userA.token, "Org A");
    const orgB = await createTestOrg(userB.token, "Org B");

    // Question belongs to Org B
    const qB = await createTestQuestion(userB.token, orgB.id, "Org B Question", "hard");

    // Org A attempts to use Org B's question in assessment
    const res = await request(app)
      .post(`/api/v1/organizations/${orgA.id}/assessments`)
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        title: "Malicious Assessment",
        questions: [
          { questionId: qB.id, questionVersion: 1, order: 1, timeAllocationMinutes: 30 },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("previews an assessment with full frozen question snapshots", async () => {
    const owner = await createTestUser({
      name: "Owner C",
      email: "owner_c@test.com",
    });
    const org = await createTestOrg(owner.token);

    const q1 = await createTestQuestion(owner.token, org.id, "Algorithmic Challenge", "medium");

    const createRes = await request(app)
      .post(`/api/v1/organizations/${org.id}/assessments`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Coding Round Assessment",
        questions: [
          { questionId: q1.id, questionVersion: 1, order: 1, timeAllocationMinutes: 45 },
        ],
      });

    const assessmentId = createRes.body.data.assessment.id;

    const previewRes = await request(app)
      .get(`/api/v1/organizations/${org.id}/assessments/${assessmentId}/preview`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(previewRes.status).toBe(200);
    expect(previewRes.body.data.preview.questionSnapshots).toHaveLength(1);
    const snap = previewRes.body.data.preview.questionSnapshots[0];
    expect(snap.title).toBe("Algorithmic Challenge");
    expect(snap.timeAllocationMinutes).toBe(45);
    expect(snap.version).toBe(1);
  });
});
