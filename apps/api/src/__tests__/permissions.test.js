import { describe, it, expect } from "vitest";
import { ORG_ROLES } from "@platform/shared";
import {
  PERMISSIONS,
  hasPermission,
  assertPermission,
  assertCanChangeRole,
  assertCanRemoveMember,
} from "../modules/organizations/permissions.js";

describe("Organization Permissions Matrix", () => {
  it("verifies Owner has all permissions", () => {
    for (const perm of Object.values(PERMISSIONS)) {
      expect(hasPermission(ORG_ROLES.OWNER, perm)).toBe(true);
      expect(() => assertPermission(ORG_ROLES.OWNER, perm)).not.toThrow();
    }
  });

  it("verifies Admin has member and org management but not ownership transfer", () => {
    expect(hasPermission(ORG_ROLES.ADMIN, PERMISSIONS.ORGANIZATION_VIEW)).toBe(
      true,
    );
    expect(
      hasPermission(ORG_ROLES.ADMIN, PERMISSIONS.ORGANIZATION_UPDATE),
    ).toBe(true);
    expect(hasPermission(ORG_ROLES.ADMIN, PERMISSIONS.MEMBER_VIEW)).toBe(true);
    expect(hasPermission(ORG_ROLES.ADMIN, PERMISSIONS.MEMBER_INVITE)).toBe(
      true,
    );
    expect(hasPermission(ORG_ROLES.ADMIN, PERMISSIONS.MEMBER_CHANGE_ROLE)).toBe(
      true,
    );
    expect(hasPermission(ORG_ROLES.ADMIN, PERMISSIONS.MEMBER_REMOVE)).toBe(
      true,
    );
    expect(hasPermission(ORG_ROLES.ADMIN, PERMISSIONS.OWNERSHIP_TRANSFER)).toBe(
      false,
    );
    expect(() =>
      assertPermission(ORG_ROLES.ADMIN, PERMISSIONS.OWNERSHIP_TRANSFER),
    ).toThrow();
  });

  it("verifies Interviewer has read-only organization and member access", () => {
    expect(
      hasPermission(ORG_ROLES.INTERVIEWER, PERMISSIONS.ORGANIZATION_VIEW),
    ).toBe(true);
    expect(hasPermission(ORG_ROLES.INTERVIEWER, PERMISSIONS.MEMBER_VIEW)).toBe(
      true,
    );
    expect(
      hasPermission(ORG_ROLES.INTERVIEWER, PERMISSIONS.ORGANIZATION_UPDATE),
    ).toBe(false);
    expect(
      hasPermission(ORG_ROLES.INTERVIEWER, PERMISSIONS.MEMBER_INVITE),
    ).toBe(false);
    expect(
      hasPermission(ORG_ROLES.INTERVIEWER, PERMISSIONS.MEMBER_CHANGE_ROLE),
    ).toBe(false);
    expect(
      hasPermission(ORG_ROLES.INTERVIEWER, PERMISSIONS.MEMBER_REMOVE),
    ).toBe(false);
  });
});

describe("Role Change Assertions", () => {
  it("rejects assigning owner role via changeRole", () => {
    expect(() =>
      assertCanChangeRole({
        actorRole: ORG_ROLES.OWNER,
        actorUserId: "user1",
        targetRole: ORG_ROLES.ADMIN,
        targetUserId: "user2",
        newRole: ORG_ROLES.OWNER,
        ownerCount: 1,
      }),
    ).toThrow(/ownership must be transferred/i);
  });

  it("rejects interviewer changing roles", () => {
    expect(() =>
      assertCanChangeRole({
        actorRole: ORG_ROLES.INTERVIEWER,
        actorUserId: "user1",
        targetRole: ORG_ROLES.INTERVIEWER,
        targetUserId: "user2",
        newRole: ORG_ROLES.ADMIN,
        ownerCount: 1,
      }),
    ).toThrow(/not allowed/i);
  });

  it("rejects admin modifying an owner", () => {
    expect(() =>
      assertCanChangeRole({
        actorRole: ORG_ROLES.ADMIN,
        actorUserId: "admin1",
        targetRole: ORG_ROLES.OWNER,
        targetUserId: "owner1",
        newRole: ORG_ROLES.INTERVIEWER,
        ownerCount: 1,
      }),
    ).toThrow(/admins cannot modify owner/i);
  });

  it("rejects self-elevation", () => {
    expect(() =>
      assertCanChangeRole({
        actorRole: ORG_ROLES.INTERVIEWER,
        actorUserId: "user1",
        targetRole: ORG_ROLES.INTERVIEWER,
        targetUserId: "user1",
        newRole: ORG_ROLES.ADMIN,
        ownerCount: 1,
      }),
    ).toThrow();
  });

  it("prevents demoting the last owner", () => {
    expect(() =>
      assertCanChangeRole({
        actorRole: ORG_ROLES.OWNER,
        actorUserId: "owner1",
        targetRole: ORG_ROLES.OWNER,
        targetUserId: "owner1",
        newRole: ORG_ROLES.ADMIN,
        ownerCount: 1,
      }),
    ).toThrow(/must always have an owner/i);
  });

  it("allows owner to promote interviewer to admin", () => {
    expect(() =>
      assertCanChangeRole({
        actorRole: ORG_ROLES.OWNER,
        actorUserId: "owner1",
        targetRole: ORG_ROLES.INTERVIEWER,
        targetUserId: "user2",
        newRole: ORG_ROLES.ADMIN,
        ownerCount: 1,
      }),
    ).not.toThrow();
  });
});

describe("Member Removal Assertions", () => {
  it("rejects interviewer removing members", () => {
    expect(() =>
      assertCanRemoveMember({
        actorRole: ORG_ROLES.INTERVIEWER,
        targetRole: ORG_ROLES.INTERVIEWER,
        ownerCount: 1,
      }),
    ).toThrow(/not allowed/i);
  });

  it("rejects admin removing an owner", () => {
    expect(() =>
      assertCanRemoveMember({
        actorRole: ORG_ROLES.ADMIN,
        targetRole: ORG_ROLES.OWNER,
        ownerCount: 1,
      }),
    ).toThrow(/cannot remove an organization owner/i);
  });

  it("rejects removing the last owner", () => {
    expect(() =>
      assertCanRemoveMember({
        actorRole: ORG_ROLES.OWNER,
        targetRole: ORG_ROLES.OWNER,
        ownerCount: 1,
      }),
    ).toThrow(/must always have an owner/i);
  });

  it("allows admin to remove an interviewer", () => {
    expect(() =>
      assertCanRemoveMember({
        actorRole: ORG_ROLES.ADMIN,
        targetRole: ORG_ROLES.INTERVIEWER,
        ownerCount: 1,
      }),
    ).not.toThrow();
  });
});
