import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { serializeOrganization } from "./organization.serializer.js";
import * as OrganizationService from "./organization.service.js";
import * as MembershipService from "./membership.service.js";
import * as InvitationService from "./invitation.service.js";

export const OrganizationController = {
  create: asyncHandler(async (req, res) => {
    const organization = await OrganizationService.createOrganization(
      req.validated,
      req.user,
    );
    return sendSuccess(res, { organization }, {}, 201);
  }),

  list: asyncHandler(async (req, res) => {
    const organizations = await OrganizationService.listOrganizationsForUser(
      req.user.id,
    );
    return sendSuccess(res, { organizations });
  }),

  get: asyncHandler(async (req, res) => {
    const organization = await OrganizationService.getOrganizationForMember(
      req.organization,
      req.membership,
    );
    return sendSuccess(res, { organization });
  }),

  update: asyncHandler(async (req, res) => {
    const updated = await OrganizationService.updateOrganization(
      req.organization,
      {
        name: req.validated.name,
        settings: req.body?.settings,
      },
    );
    return sendSuccess(res, {
      organization: serializeOrganization(updated, req.membership.role),
    });
  }),

  listMembers: asyncHandler(async (req, res) => {
    const members = await MembershipService.listMembers(req.organization._id);
    return sendSuccess(res, { members });
  }),

  updateMember: asyncHandler(async (req, res) => {
    const membership = await MembershipService.changeMemberRole({
      organization: req.organization,
      actorMembership: req.membership,
      actorUserId: req.user.id,
      membershipId: req.params.membershipId,
      newRole: req.validated.role,
    });
    return sendSuccess(res, { membership });
  }),

  removeMember: asyncHandler(async (req, res) => {
    const result = await MembershipService.removeMember({
      organization: req.organization,
      actorMembership: req.membership,
      membershipId: req.params.membershipId,
    });
    return sendSuccess(res, result);
  }),

  transferOwnership: asyncHandler(async (req, res) => {
    const membership = await MembershipService.transferOwnership({
      organization: req.organization,
      actorMembership: req.membership,
      actorUserId: req.user.id,
      membershipId: req.validated.membershipId,
    });
    return sendSuccess(res, { membership });
  }),

  createInvitation: asyncHandler(async (req, res) => {
    const result = await InvitationService.createInvitation({
      organization: req.organization,
      actorUserId: req.user.id,
      email: req.validated.email,
      invitedRole: req.validated.role,
    });
    return sendSuccess(res, result, {}, 201);
  }),

  listInvitations: asyncHandler(async (req, res) => {
    const invitations = await InvitationService.listInvitations(
      req.organization._id,
    );
    return sendSuccess(res, { invitations });
  }),

  revokeInvitation: asyncHandler(async (req, res) => {
    const invitation = await InvitationService.revokeInvitation({
      organizationId: req.organization._id,
      invitationId: req.params.invitationId,
    });
    return sendSuccess(res, { invitation });
  }),

  acceptInvitation: asyncHandler(async (req, res) => {
    const result = await InvitationService.acceptInvitation({
      token: req.validated.token,
      user: req.user,
    });
    return sendSuccess(res, result);
  }),
};
