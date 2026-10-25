import mongoose from "mongoose";
import { ERROR_CODES } from "@platform/shared";
import { AppError } from "./error.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { Organization } from "../modules/organizations/organization.model.js";
import { OrganizationMembership } from "../modules/organizations/membership.model.js";
import { hasPermission } from "../modules/organizations/permissions.js";

function notFound() {
  return new AppError(
    "The requested resource was not found",
    404,
    ERROR_CODES.NOT_FOUND,
  );
}

/**
 * Resolve organization membership from authenticated identity.
 * Non-members receive 404 so organization IDs cannot be enumerated.
 *
 * @param {string} [permission]
 */
export function requireOrganization(permission) {
  return asyncHandler(async (req, _res, next) => {
    const organizationId = req.params.organizationId;
    if (!mongoose.isValidObjectId(organizationId)) {
      throw notFound();
    }

    const membership = await OrganizationMembership.findOne({
      organizationId,
      userId: req.user.id,
      status: "active",
    });

    if (!membership) {
      throw notFound();
    }

    if (permission && !hasPermission(membership.role, permission)) {
      throw new AppError(
        "You are not allowed to perform this action",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    const organization = await Organization.findById(organizationId);
    if (!organization || organization.status !== "active") {
      throw notFound();
    }

    req.organization = organization;
    req.membership = membership;
    next();
  });
}
