import mongoose from "mongoose";
import { ERROR_CODES, ORG_ROLES, USER_STATUS } from "@platform/shared";
import { AppError } from "../../middleware/error.middleware.js";
import { withTransaction } from "../../utils/transaction.js";
import { User } from "../auth/user.model.js";
import { Organization } from "./organization.model.js";
import { OrganizationMembership } from "./membership.model.js";
import {
  assertCanChangeRole,
  assertCanRemoveMember,
} from "./permissions.js";
import { serializeMembership } from "./organization.serializer.js";

function notFound() {
  return new AppError(
    "The requested resource was not found",
    404,
    ERROR_CODES.NOT_FOUND,
  );
}

export async function countOwners(organizationId, session) {
  return OrganizationMembership.countDocuments({
    organizationId,
    role: ORG_ROLES.OWNER,
    status: "active",
  }).session(session || null);
}

export async function listMembers(organizationId) {
  const memberships = await OrganizationMembership.find({
    organizationId,
    status: "active",
  }).lean();

  const users = await User.find({
    _id: { $in: memberships.map((item) => item.userId) },
    status: USER_STATUS.ACTIVE,
  }).lean();
  const usersById = new Map(users.map((user) => [String(user._id), user]));

  return memberships.map((membership) =>
    serializeMembership(membership, usersById.get(String(membership.userId))),
  );
}

export async function changeMemberRole({
  organization,
  actorMembership,
  actorUserId,
  membershipId,
  newRole,
}) {
  if (!mongoose.isValidObjectId(membershipId)) {
    throw notFound();
  }

  const target = await OrganizationMembership.findOne({
    _id: membershipId,
    organizationId: organization._id,
    status: "active",
  });
  if (!target) {
    throw notFound();
  }

  const ownerCount = await countOwners(organization._id);
  assertCanChangeRole({
    actorRole: actorMembership.role,
    actorUserId: String(actorUserId),
    targetRole: target.role,
    targetUserId: String(target.userId),
    newRole,
    ownerCount,
  });

  target.role = newRole;
  await target.save();
  const user = await User.findById(target.userId).lean();
  return serializeMembership(target, user);
}

export async function removeMember({
  organization,
  actorMembership,
  membershipId,
}) {
  if (!mongoose.isValidObjectId(membershipId)) {
    throw notFound();
  }

  const target = await OrganizationMembership.findOne({
    _id: membershipId,
    organizationId: organization._id,
    status: "active",
  });
  if (!target) {
    throw notFound();
  }

  const ownerCount = await countOwners(organization._id);
  assertCanRemoveMember({
    actorRole: actorMembership.role,
    targetRole: target.role,
    ownerCount,
  });

  await target.deleteOne();
  return { removed: true, membershipId: String(membershipId) };
}

export async function transferOwnership({
  organization,
  actorMembership,
  actorUserId,
  membershipId,
}) {
  if (actorMembership.role !== ORG_ROLES.OWNER) {
    throw new AppError(
      "You are not allowed to perform this action",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }
  if (!mongoose.isValidObjectId(membershipId)) {
    throw notFound();
  }

  return withTransaction(async (session) => {
    const target = await OrganizationMembership.findOne({
      _id: membershipId,
      organizationId: organization._id,
      status: "active",
    }).session(session);

    if (!target) {
      throw notFound();
    }
    if (String(target.userId) === String(actorUserId)) {
      throw new AppError(
        "You already own this organization",
        409,
        ERROR_CODES.CONFLICT,
      );
    }

    const currentOwner = await OrganizationMembership.findOne({
      organizationId: organization._id,
      userId: actorUserId,
      role: ORG_ROLES.OWNER,
      status: "active",
    }).session(session);

    if (!currentOwner) {
      throw notFound();
    }

    target.role = ORG_ROLES.OWNER;
    currentOwner.role = ORG_ROLES.ADMIN;
    await target.save({ session });
    await currentOwner.save({ session });

    await Organization.updateOne(
      { _id: organization._id },
      { $set: { ownerUserId: target.userId } },
      { session },
    );

    const user = await User.findById(target.userId).session(session).lean();
    return serializeMembership(target, user);
  });
}
