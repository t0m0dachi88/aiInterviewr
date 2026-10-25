import { ERROR_CODES, ORG_ROLES } from "@platform/shared";
import { AppError } from "../../middleware/error.middleware.js";

export const PERMISSIONS = Object.freeze({
  ORGANIZATION_VIEW: "organization:view",
  ORGANIZATION_UPDATE: "organization:update",
  MEMBER_VIEW: "member:view",
  MEMBER_INVITE: "member:invite",
  MEMBER_CHANGE_ROLE: "member:change_role",
  MEMBER_REMOVE: "member:remove",
  OWNERSHIP_TRANSFER: "ownership:transfer",
});

const ROLE_PERMISSIONS = Object.freeze({
  [ORG_ROLES.OWNER]: new Set(Object.values(PERMISSIONS)),
  [ORG_ROLES.ADMIN]: new Set([
    PERMISSIONS.ORGANIZATION_VIEW,
    PERMISSIONS.ORGANIZATION_UPDATE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_CHANGE_ROLE,
    PERMISSIONS.MEMBER_REMOVE,
  ]),
  [ORG_ROLES.INTERVIEWER]: new Set([
    PERMISSIONS.ORGANIZATION_VIEW,
    PERMISSIONS.MEMBER_VIEW,
  ]),
});

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.has(permission) === true;
}

export function assertPermission(role, permission) {
  if (!hasPermission(role, permission)) {
    throw new AppError(
      "You are not allowed to perform this action",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }
}

/**
 * Role-change rules:
 * - Owner role cannot be assigned through this path (use transfer).
 * - Interviewers cannot change roles.
 * - Admins cannot modify owners or assign owner.
 * - Users cannot promote themselves to owner.
 * - The last owner cannot be demoted.
 */
export function assertCanChangeRole({
  actorRole,
  actorUserId,
  targetRole,
  targetUserId,
  newRole,
  ownerCount,
}) {
  if (newRole === ORG_ROLES.OWNER) {
    throw new AppError(
      "Ownership must be transferred with an explicit operation",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  if (actorUserId === targetUserId && newRole !== targetRole) {
    if (roleRank(newRole) > roleRank(targetRole)) {
      throw new AppError(
        "You cannot assign yourself elevated permissions",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }
  }

  if (actorRole === ORG_ROLES.INTERVIEWER) {
    throw new AppError(
      "You are not allowed to perform this action",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  if (actorRole === ORG_ROLES.ADMIN) {
    if (targetRole === ORG_ROLES.OWNER || newRole === ORG_ROLES.OWNER) {
      throw new AppError(
        "Admins cannot modify owner memberships",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }
  }

  if (
    targetRole === ORG_ROLES.OWNER &&
    newRole !== ORG_ROLES.OWNER &&
    ownerCount <= 1
  ) {
    throw new AppError(
      "An organization must always have an owner",
      409,
      ERROR_CODES.CONFLICT,
    );
  }
}

/**
 * Removal rules:
 * - Interviewers cannot remove members.
 * - Admins cannot remove owners.
 * - The last owner cannot be removed.
 */
export function assertCanRemoveMember({ actorRole, targetRole, ownerCount }) {
  if (actorRole === ORG_ROLES.INTERVIEWER) {
    throw new AppError(
      "You are not allowed to perform this action",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  if (actorRole === ORG_ROLES.ADMIN && targetRole === ORG_ROLES.OWNER) {
    throw new AppError(
      "Admins cannot remove an organization owner",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  if (targetRole === ORG_ROLES.OWNER && ownerCount <= 1) {
    throw new AppError(
      "An organization must always have an owner",
      409,
      ERROR_CODES.CONFLICT,
    );
  }
}

function roleRank(role) {
  if (role === ORG_ROLES.OWNER) return 3;
  if (role === ORG_ROLES.ADMIN) return 2;
  return 1;
}
