import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { connectTestDb, clearTestDb, disconnectTestDb } from "../test/db.js";
import { Organization } from "../modules/organizations/organization.model.js";
import { OrganizationMembership } from "../modules/organizations/membership.model.js";

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

describe("Organization API Endpoints (/api/v1/organizations & invitations)", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe("POST /api/v1/organizations", () => {
    it("creates an organization and automatically makes the creator the owner", async () => {
      const owner = await createTestUser({
        name: "Acme Owner",
        email: "owner@acme.com",
      });

      const res = await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          name: "Acme Corp",
          slug: "acme-corp",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organization.name).toBe("Acme Corp");
      expect(res.body.data.organization.slug).toBe("acme-corp");
      expect(res.body.data.organization.role).toBe("owner");

      const membership = await OrganizationMembership.findOne({
        organizationId: res.body.data.organization.id,
        userId: owner.user.id,
      });
      expect(membership).not.toBeNull();
      expect(membership.role).toBe("owner");
      expect(membership.status).toBe("active");
    });

    it("automatically derives slug if slug is not provided", async () => {
      const owner = await createTestUser({
        name: "Beta Owner",
        email: "owner@beta.com",
      });

      const res = await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          name: "Beta Technologies",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.organization.slug).toBe("beta-technologies");
    });

    it("rejects unauthorized request without token", async () => {
      const res = await request(app).post("/api/v1/organizations").send({
        name: "Unauthorized Corp",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/organizations and GET /:organizationId", () => {
    it("lists only organizations the user belongs to", async () => {
      const userA = await createTestUser({
        name: "User A",
        email: "usera@test.com",
      });
      const userB = await createTestUser({
        name: "User B",
        email: "userb@test.com",
      });

      await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${userA.token}`)
        .send({ name: "Org Alpha" });

      await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${userB.token}`)
        .send({ name: "Org Bravo" });

      const resA = await request(app)
        .get("/api/v1/organizations")
        .set("Authorization", `Bearer ${userA.token}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.organizations.length).toBe(1);
      expect(resA.body.data.organizations[0].name).toBe("Org Alpha");
      expect(resA.body.data.organizations[0].role).toBe("owner");
    });

    it("prevents cross-tenant access to another organization (returns 404 to avoid enumeration)", async () => {
      const userA = await createTestUser({
        name: "User A",
        email: "usera2@test.com",
      });
      const userB = await createTestUser({
        name: "User B",
        email: "userb2@test.com",
      });

      const createRes = await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${userA.token}`)
        .send({ name: "Org Private" });

      const orgId = createRes.body.data.organization.id;

      const resB = await request(app)
        .get(`/api/v1/organizations/${orgId}`)
        .set("Authorization", `Bearer ${userB.token}`);

      expect(resB.status).toBe(404);
      expect(resB.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("PATCH /api/v1/organizations/:organizationId settings", () => {
    it("allows owner to update settings", async () => {
      const owner = await createTestUser({
        name: "Settings Owner",
        email: "settings@owner.com",
      });
      const createRes = await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ name: "Config Org" });

      const orgId = createRes.body.data.organization.id;

      const updateRes = await request(app)
        .patch(`/api/v1/organizations/${orgId}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          name: "Config Org Renamed",
          settings: {
            defaultInterviewDurationMinutes: 45,
            recordingEnabled: true,
          },
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.organization.name).toBe("Config Org Renamed");
      expect(
        updateRes.body.data.organization.settings
          .defaultInterviewDurationMinutes,
      ).toBe(45);
      expect(updateRes.body.data.organization.settings.recordingEnabled).toBe(
        true,
      );
    });
  });

  describe("Members and Invitations flow", () => {
    it("allows owner to invite an interviewer and the candidate accepts it", async () => {
      const owner = await createTestUser({
        name: "Acme Founder",
        email: "founder@acme.com",
      });
      const orgRes = await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ name: "Acme Interview System" });

      const orgId = orgRes.body.data.organization.id;

      // 1. Owner invites an interviewer
      const inviteRes = await request(app)
        .post(`/api/v1/organizations/${orgId}/invitations`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: "interviewer@acme.com",
          role: "interviewer",
        });

      expect(inviteRes.status).toBe(201);
      expect(inviteRes.body.data.invitation.email).toBe("interviewer@acme.com");
      expect(inviteRes.body.data.invitation.invitedRole).toBe("interviewer");
      expect(inviteRes.body.data.invitation.status).toBe("pending");

      // In non-production, debugToken is returned for test convenience
      const token = inviteRes.body.data.debugToken;
      expect(token).toBeDefined();

      // 2. Owner lists invitations
      const listInvRes = await request(app)
        .get(`/api/v1/organizations/${orgId}/invitations`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(listInvRes.status).toBe(200);
      expect(listInvRes.body.data.invitations.length).toBe(1);

      // 3. Interviewer signs up and accepts invitation
      const interviewer = await createTestUser({
        name: "Jane Interviewer",
        email: "interviewer@acme.com",
      });

      const acceptRes = await request(app)
        .post(`/api/v1/invitations/${token}/accept`)
        .set("Authorization", `Bearer ${interviewer.token}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.data.alreadyMember).toBe(false);
      expect(acceptRes.body.data.membership.role).toBe("interviewer");

      // 4. Verify interviewer is now a member in listMembers
      const membersRes = await request(app)
        .get(`/api/v1/organizations/${orgId}/members`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(membersRes.status).toBe(200);
      expect(membersRes.body.data.members.length).toBe(2);

      const roles = membersRes.body.data.members.map((m) => m.role);
      expect(roles).toContain("owner");
      expect(roles).toContain("interviewer");
    });

    it("allows owner to promote member from interviewer to admin", async () => {
      const owner = await createTestUser({
        name: "Owner Role Boss",
        email: "boss@test.com",
      });
      const orgRes = await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ name: "Role Test Org" });

      const orgId = orgRes.body.data.organization.id;

      const inviteRes = await request(app)
        .post(`/api/v1/organizations/${orgId}/invitations`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: "promoteme@test.com",
          role: "interviewer",
        });

      const token = inviteRes.body.data.debugToken;
      const colleague = await createTestUser({
        name: "Colleague",
        email: "promoteme@test.com",
      });

      const acceptRes = await request(app)
        .post(`/api/v1/invitations/${token}/accept`)
        .set("Authorization", `Bearer ${colleague.token}`);

      const memberId = acceptRes.body.data.membership.id;

      // Promote to admin
      const promoteRes = await request(app)
        .patch(`/api/v1/organizations/${orgId}/members/${memberId}`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ role: "admin" });

      expect(promoteRes.status).toBe(200);
      expect(promoteRes.body.data.membership.role).toBe("admin");
    });

    it("allows owner to transfer ownership to another member", async () => {
      const owner = await createTestUser({
        name: "Old Owner",
        email: "oldowner@test.com",
      });
      const orgRes = await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ name: "Transfer Org" });

      const orgId = orgRes.body.data.organization.id;

      const inviteRes = await request(app)
        .post(`/api/v1/organizations/${orgId}/invitations`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: "newowner@test.com",
          role: "admin",
        });

      const token = inviteRes.body.data.debugToken;
      const successor = await createTestUser({
        name: "Successor",
        email: "newowner@test.com",
      });

      const acceptRes = await request(app)
        .post(`/api/v1/invitations/${token}/accept`)
        .set("Authorization", `Bearer ${successor.token}`);

      const successorMemberId = acceptRes.body.data.membership.id;

      // Transfer ownership
      const transferRes = await request(app)
        .post(`/api/v1/organizations/${orgId}/transfer-ownership`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ membershipId: successorMemberId });

      expect(transferRes.status).toBe(200);
      expect(transferRes.body.data.membership.role).toBe("owner");

      // Verify org ownerUserId updated
      const org = await Organization.findById(orgId);
      expect(String(org.ownerUserId)).toBe(successor.user.id);
    });

    it("allows owner to revoke an invitation", async () => {
      const owner = await createTestUser({
        name: "Revoker Owner",
        email: "revoker@test.com",
      });
      const orgRes = await request(app)
        .post("/api/v1/organizations")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ name: "Revoke Org" });

      const orgId = orgRes.body.data.organization.id;

      const inviteRes = await request(app)
        .post(`/api/v1/organizations/${orgId}/invitations`)
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          email: "canceled@test.com",
          role: "interviewer",
        });

      const invId = inviteRes.body.data.invitation.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/organizations/${orgId}/invitations/${invId}`)
        .set("Authorization", `Bearer ${owner.token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.invitation.status).toBe("revoked");
    });
  });
});
