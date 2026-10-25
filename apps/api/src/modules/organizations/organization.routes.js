import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { requireOrganization } from "../../middleware/authorize-organization.middleware.js";
import {
  validateBody,
  validators,
} from "../../middleware/validate.middleware.js";
import { PERMISSIONS } from "./permissions.js";
import { OrganizationController } from "./organization.controller.js";

const router = Router();

// All organization routes require authentication
router.use(authenticate);

// Organization collection routes
router.post(
  "/",
  validateBody({
    name: validators.organizationName,
    slug: validators.optionalSlug,
  }),
  OrganizationController.create,
);

router.get("/", OrganizationController.list);

// Organization specific routes
router.get(
  "/:organizationId",
  requireOrganization(PERMISSIONS.ORGANIZATION_VIEW),
  OrganizationController.get,
);

router.patch(
  "/:organizationId",
  requireOrganization(PERMISSIONS.ORGANIZATION_UPDATE),
  validateBody({
    name: validators.optionalOrganizationName,
  }),
  OrganizationController.update,
);

// Member routes
router.get(
  "/:organizationId/members",
  requireOrganization(PERMISSIONS.MEMBER_VIEW),
  OrganizationController.listMembers,
);

router.patch(
  "/:organizationId/members/:membershipId",
  requireOrganization(PERMISSIONS.MEMBER_CHANGE_ROLE),
  validateBody({
    role: validators.membershipRole,
  }),
  OrganizationController.updateMember,
);

router.delete(
  "/:organizationId/members/:membershipId",
  requireOrganization(PERMISSIONS.MEMBER_REMOVE),
  OrganizationController.removeMember,
);

router.post(
  "/:organizationId/transfer-ownership",
  requireOrganization(PERMISSIONS.OWNERSHIP_TRANSFER),
  validateBody({
    membershipId: validators.membershipId,
  }),
  OrganizationController.transferOwnership,
);

// Invitation routes within organization
router.post(
  "/:organizationId/invitations",
  requireOrganization(PERMISSIONS.MEMBER_INVITE),
  validateBody({
    email: validators.email,
    role: validators.invitedRole,
  }),
  OrganizationController.createInvitation,
);

router.get(
  "/:organizationId/invitations",
  requireOrganization(PERMISSIONS.MEMBER_INVITE),
  OrganizationController.listInvitations,
);

router.delete(
  "/:organizationId/invitations/:invitationId",
  requireOrganization(PERMISSIONS.MEMBER_INVITE),
  OrganizationController.revokeInvitation,
);

export default router;
