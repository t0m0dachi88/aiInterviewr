import mongoose from "mongoose";
import { ERROR_CODES, INVITATION_STATUS, ORG_ROLES } from "@platform/shared";
import { AppError } from "../../middleware/error.middleware.js";
import { env } from "../../config/env.js";
import { withTransaction } from "../../utils/transaction.js";
import { User } from "../auth/user.model.js";
import { OrganizationMembership } from "./membership.model.js";
import { OrganizationInvitation } from "./invitation.model.js";
import { Organization } from "./organization.model.js";
import {
  generateInvitationToken,
  hashInvitationToken,
} from "../auth/token.service.js";
import { buildInvitationEmail, sendEmail } from "../email/email.service.js";
import { serializeInvitation } from "./organization.serializer.js";
import { serializeMembership } from "./organization.serializer.js";

function notFound() {
  return new AppError(
    "The requested resource was not found",
    404,
    ERROR_CODES.NOT_FOUND,
  );
}

function resolveStatus(invitation) {
  if (
    invitation.status === INVITATION_STATUS.PENDING &&
    invitation.expiresAt.getTime() <= Date.now()
  ) {
    return INVITATION_STATUS.EXPIRED;
  }
  return invitation.status;
}

export async function createInvitation({
  organization,
  actorUserId,
  email,
  invitedRole,
}) {
  if (invitedRole === ORG_ROLES.OWNER) {
    throw new AppError(
      "Invited role must be admin or interviewer",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const existingMember = await User.findOne({ email }).lean();
  if (existingMember) {
    const membership = await OrganizationMembership.findOne({
      organizationId: organization._id,
      userId: existingMember._id,
      status: "active",
    });
    if (membership) {
      throw new AppError(
        "That user is already a member of this organization",
        409,
        ERROR_CODES.CONFLICT,
      );
    }
  }

  const duplicate = await OrganizationInvitation.findOne({
    organizationId: organization._id,
    email,
    status: INVITATION_STATUS.PENDING,
  });
  if (duplicate) {
    if (duplicate.expiresAt.getTime() <= Date.now()) {
      duplicate.status = INVITATION_STATUS.EXPIRED;
      await duplicate.save();
    } else {
      throw new AppError(
        "A pending invitation already exists for this email",
        409,
        ERROR_CODES.CONFLICT,
      );
    }
  }

  const token = generateInvitationToken();
  const expiresAt = new Date(
    Date.now() + (env.INVITATION_EXPIRES_DAYS || 7) * 24 * 60 * 60 * 1000,
  );

  let invitation;
  try {
    invitation = await OrganizationInvitation.create({
      organizationId: organization._id,
      email,
      invitedRole,
      tokenHash: hashInvitationToken(token),
      invitedBy: actorUserId,
      status: INVITATION_STATUS.PENDING,
      expiresAt,
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError(
        "A pending invitation already exists for this email",
        409,
        ERROR_CODES.CONFLICT,
      );
    }
    throw err;
  }

  const acceptUrl = `${env.APP_PUBLIC_URL.replace(/\/+$/, "")}/invitations/accept?token=${encodeURIComponent(token)}`;
  const emailContent = buildInvitationEmail({
    organizationName: organization.name,
    role: invitedRole,
    acceptUrl,
  });
  const delivery = await sendEmail({
    to: email,
    ...emailContent,
  });

  const payload = {
    invitation: serializeInvitation(invitation),
    email: {
      delivered: delivery.delivered,
      reason: delivery.reason || null,
    },
  };

  if (!env.isProduction) {
    payload.debugToken = token;
  }

  return payload;
}

export async function listInvitations(organizationId) {
  const invitations = await OrganizationInvitation.find({
    organizationId,
  })
    .sort({ createdAt: -1 })
    .lean();

  const updates = [];
  const serialized = invitations.map((invitation) => {
    const status = resolveStatus(invitation);
    if (
      invitation.status === INVITATION_STATUS.PENDING &&
      status === INVITATION_STATUS.EXPIRED
    ) {
      updates.push(invitation._id);
    }
    return serializeInvitation({ ...invitation, status });
  });

  if (updates.length > 0) {
    await OrganizationInvitation.updateMany(
      { _id: { $in: updates } },
      { $set: { status: INVITATION_STATUS.EXPIRED } },
    );
  }

  return serialized;
}

export async function revokeInvitation({ organizationId, invitationId }) {
  if (!mongoose.isValidObjectId(invitationId)) {
    throw notFound();
  }

  const invitation = await OrganizationInvitation.findOne({
    _id: invitationId,
    organizationId,
  });
  if (!invitation) {
    throw notFound();
  }

  const status = resolveStatus(invitation);
  if (status !== INVITATION_STATUS.PENDING) {
    throw new AppError(
      "Only pending invitations can be revoked",
      409,
      ERROR_CODES.CONFLICT,
    );
  }

  invitation.status = INVITATION_STATUS.REVOKED;
  invitation.revokedAt = new Date();
  await invitation.save();
  return serializeInvitation(invitation);
}

export async function acceptInvitation({ token, user }) {
  const tokenHash = hashInvitationToken(token);

  return withTransaction(async (session) => {
    const invitation = await OrganizationInvitation.findOne({
      tokenHash,
    }).session(session);

    if (!invitation) {
      throw notFound();
    }

    if (invitation.status === INVITATION_STATUS.REVOKED) {
      throw new AppError(
        "This invitation has been revoked",
        409,
        ERROR_CODES.INVITATION_REVOKED,
      );
    }

    if (
      invitation.status === INVITATION_STATUS.EXPIRED ||
      invitation.expiresAt.getTime() <= Date.now()
    ) {
      if (invitation.status === INVITATION_STATUS.PENDING) {
        invitation.status = INVITATION_STATUS.EXPIRED;
        await invitation.save({ session });
      }
      throw new AppError(
        "This invitation has expired",
        409,
        ERROR_CODES.INVITATION_EXPIRED,
      );
    }

    if (invitation.status === INVITATION_STATUS.ACCEPTED) {
      throw new AppError(
        "This invitation has already been used",
        409,
        ERROR_CODES.CONFLICT,
      );
    }

    if (invitation.email !== user.email) {
      throw new AppError(
        "This invitation was issued to a different email address",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    const existing = await OrganizationMembership.findOne({
      organizationId: invitation.organizationId,
      userId: user.id,
    }).session(session);

    if (existing) {
      invitation.status = INVITATION_STATUS.ACCEPTED;
      invitation.acceptedAt = new Date();
      await invitation.save({ session });
      const memberUser = await User.findById(user.id).session(session).lean();
      return {
        membership: serializeMembership(existing, memberUser),
        alreadyMember: true,
      };
    }

    const [membership] = await OrganizationMembership.create(
      [
        {
          organizationId: invitation.organizationId,
          userId: user.id,
          role: invitation.invitedRole,
          status: "active",
          invitedBy: invitation.invitedBy,
        },
      ],
      { session },
    );

    invitation.status = INVITATION_STATUS.ACCEPTED;
    invitation.acceptedAt = new Date();
    await invitation.save({ session });

    const organization = await Organization.findById(invitation.organizationId)
      .session(session)
      .lean();
    const memberUser = await User.findById(user.id).session(session).lean();

    return {
      membership: serializeMembership(membership, memberUser),
      organizationId: String(invitation.organizationId),
      organizationName: organization?.name,
      alreadyMember: false,
    };
  });
}
