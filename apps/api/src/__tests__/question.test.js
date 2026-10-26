import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { connectTestDb, clearTestDb, disconnectTestDb } from "../test/db.js";
import { Question } from "../modules/questions/question.model.js";

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

describe("Question Bank API (/api/v1/organizations/:organizationId/questions)", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it("creates a question and initializes version 1", async () => {
    const owner = await createTestUser({
      name: "Owner 1",
      email: "owner1@test.com",
    });
    const org = await createTestOrg(owner.token);

    const res = await request(app)
      .post(`/api/v1/organizations/${org.id}/questions`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Two Sum",
        category: "data_structures_and_algorithms",
        difficulty: "easy",
        questionType: "coding",
        statement: "Given an array of integers, return indices of two numbers.",
        tags: ["array", "hash-table"],
        expectedDurationMinutes: 25,
        constraints: ["2 <= nums.length <= 10^4"],
        examples: [{ input: "[2,7,11,15], target = 9", output: "[0,1]" }],
        starterCodeByLanguage: {
          javascript: "function twoSum(nums, target) {}",
          python: "def two_sum(nums, target):",
        },
        publicTests: [
          { input: "nums = [2,7,11,15], target = 9", expectedOutput: "[0,1]" },
        ],
        hiddenTests: [
          { input: "nums = [3,2,4], target = 6", expectedOutput: "[1,2]" },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const q = res.body.data.question;
    expect(q.title).toBe("Two Sum");
    expect(q.difficulty).toBe("easy");
    expect(q.currentVersion).toBe(1);
    expect(q.activeVersion).toBe(1);
    expect(q.starterCodeByLanguage.javascript).toBe(
      "function twoSum(nums, target) {}",
    );
    expect(q.hiddenTests).toHaveLength(1);

    const doc = await Question.findById(q.id);
    expect(doc.versions).toHaveLength(1);
    expect(doc.versions[0].version).toBe(1);
  });

  it("increments version and preserves version history when content is modified", async () => {
    const owner = await createTestUser({
      name: "Owner 2",
      email: "owner2@test.com",
    });
    const org = await createTestOrg(owner.token);

    // 1. Create version 1
    const createRes = await request(app)
      .post(`/api/v1/organizations/${org.id}/questions`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Reverse String",
        difficulty: "easy",
        statement: "Reverse an array of characters in-place.",
      });

    const questionId = createRes.body.data.question.id;
    expect(createRes.body.data.question.currentVersion).toBe(1);

    // 2. Update with modified statement -> should trigger version 2
    const updateRes = await request(app)
      .patch(`/api/v1/organizations/${org.id}/questions/${questionId}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        statement: "Reverse an array of characters in-place with O(1) extra memory.",
        changeSummary: "Added O(1) memory constraint to statement",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.question.currentVersion).toBe(2);
    expect(updateRes.body.data.question.activeVersion).toBe(2);
    expect(updateRes.body.data.question.statement).toBe(
      "Reverse an array of characters in-place with O(1) extra memory.",
    );

    // 3. Query historical version 1 explicitly
    const v1Res = await request(app)
      .get(`/api/v1/organizations/${org.id}/questions/${questionId}?version=1`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(v1Res.status).toBe(200);
    expect(v1Res.body.data.question.activeVersion).toBe(1);
    expect(v1Res.body.data.question.statement).toBe(
      "Reverse an array of characters in-place.",
    );

    // 4. Query version history endpoint
    const historyRes = await request(app)
      .get(`/api/v1/organizations/${org.id}/questions/${questionId}/versions`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.versions).toHaveLength(2);
    expect(historyRes.body.data.versions[0].version).toBe(1);
    expect(historyRes.body.data.versions[1].version).toBe(2);
  });

  it("archives questions and filters by category and difficulty", async () => {
    const owner = await createTestUser({
      name: "Owner 3",
      email: "owner3@test.com",
    });
    const org = await createTestOrg(owner.token);

    // Create 3 questions
    const q1 = await request(app)
      .post(`/api/v1/organizations/${org.id}/questions`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Binary Tree Inorder",
        category: "data_structures_and_algorithms",
        difficulty: "easy",
        statement: "Return inorder traversal.",
      });

    const q2 = await request(app)
      .post(`/api/v1/organizations/${org.id}/questions`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "LRU Cache",
        category: "data_structures_and_algorithms",
        difficulty: "hard",
        statement: "Design an LRU Cache.",
      });

    const q3 = await request(app)
      .post(`/api/v1/organizations/${org.id}/questions`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "REST API Design",
        category: "backend_engineering",
        difficulty: "medium",
        questionType: "system_design",
        statement: "Design a scalable REST API.",
      });

    // Filter by difficulty
    const filterRes = await request(app)
      .get(`/api/v1/organizations/${org.id}/questions?difficulty=hard`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data.questions).toHaveLength(1);
    expect(filterRes.body.data.questions[0].title).toBe("LRU Cache");

    // Search by text
    const searchRes = await request(app)
      .get(`/api/v1/organizations/${org.id}/questions?search=Binary`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.questions).toHaveLength(1);
    expect(searchRes.body.data.questions[0].title).toBe("Binary Tree Inorder");

    // Archive q1
    const archiveRes = await request(app)
      .post(
        `/api/v1/organizations/${org.id}/questions/${q1.body.data.question.id}/archive`,
      )
      .set("Authorization", `Bearer ${owner.token}`);

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.question.status).toBe("archived");

    // Default list should now only contain active questions
    const listRes = await request(app)
      .get(`/api/v1/organizations/${org.id}/questions`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(listRes.body.data.questions).toHaveLength(2);
    expect(
      listRes.body.data.questions.map((q) => q.title),
    ).not.toContain("Binary Tree Inorder");
  });

  it("enforces tenant isolation: user from Org B cannot access Org A question", async () => {
    const userA = await createTestUser({
      name: "User A",
      email: "usera@test.com",
    });
    const userB = await createTestUser({
      name: "User B",
      email: "userb@test.com",
    });

    const orgA = await createTestOrg(userA.token, "Org A");
    const orgB = await createTestOrg(userB.token, "Org B");

    const qA = await request(app)
      .post(`/api/v1/organizations/${orgA.id}/questions`)
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        title: "Confidential Algorithm",
        difficulty: "hard",
        statement: "Proprietary algorithmic problem.",
      });

    const questionId = qA.body.data.question.id;

    // User B tries to read Org A's question via Org A URL -> 404
    const resForbiddenOrgA = await request(app)
      .get(`/api/v1/organizations/${orgA.id}/questions/${questionId}`)
      .set("Authorization", `Bearer ${userB.token}`);
    expect(resForbiddenOrgA.status).toBe(404);

    // User B tries to read Org A's question via Org B URL -> 404
    const resCrossTenant = await request(app)
      .get(`/api/v1/organizations/${orgB.id}/questions/${questionId}`)
      .set("Authorization", `Bearer ${userB.token}`);
    expect(resCrossTenant.status).toBe(404);

    // User B tries to modify Org A's question via Org B URL -> 404
    const resCrossModify = await request(app)
      .patch(`/api/v1/organizations/${orgB.id}/questions/${questionId}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ title: "Tampered Title" });
    expect(resCrossModify.status).toBe(404);
  });
});
