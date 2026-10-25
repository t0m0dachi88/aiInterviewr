import { ERROR_CODES, ORG_ROLES } from "@platform/shared";
import { AppError } from "../../middleware/error.middleware.js";
import { env } from "../../config/env.js";
import { withTransaction } from "../../utils/transaction.js";
import { slugify, uniqueSlug } from "../../utils/slug.js";
import { Organization } from "./organization.model.js";
import { OrganizationMembership } from "./membership.model.js";
import { serializeOrganization } from "./organization.serializer.js";

function notFound() {
  return new AppError(
    "The requested resource was not found",
    404,
    ERROR_CODES.NOT_FOUND,
  );
}

export async function createOrganization({ name, slug }, user) {
  if (env.REQUIRE_EMAIL_VERIFICATION && !user.emailVerifiedAt) {
    throw new AppError(
      "Verify your email before creating an organization",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  let candidate = slug || slugify(name);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const created = await withTransaction(async (session) => {
        const [organization] = await Organization.create(
          [
            {
              name,
              slug: candidate,
              ownerUserId: user.id,
              status: "active",
            },
          ],
          { session },
        );

        await OrganizationMembership.create(
          [
            {
              organizationId: organization._id,
              userId: user.id,
              role: ORG_ROLES.OWNER,
              status: "active",
            },
          ],
          { session },
        );

        return organization;
      });

      return serializeOrganization(created, ORG_ROLES.OWNER);
    } catch (err) {
      if (err?.code === 11000) {
        candidate = uniqueSlug(slugify(name));
        continue;
      }
      throw err;
    }
  }

  throw new AppError(
    "Unable to allocate a unique organization slug",
    409,
    ERROR_CODES.CONFLICT,
  );
}

export async function listOrganizationsForUser(userId) {
  const memberships = await OrganizationMembership.find({
    userId,
    status: "active",
  }).lean();

  if (memberships.length === 0) {
    return [];
  }

  const ids = memberships.map((item) => item.organizationId);
  const organizations = await Organization.find({
    _id: { $in: ids },
    status: "active",
  }).lean();

  const roleByOrg = new Map(
    memberships.map((item) => [String(item.organizationId), item.role]),
  );

  return organizations.map((organization) =>
    serializeOrganization(organization, roleByOrg.get(String(organization._id))),
  );
}

export async function getOrganizationForMember(organization, membership) {
  return serializeOrganization(organization, membership.role);
}

export async function updateOrganization(organization, payload) {
  if (payload.name) {
    organization.name = payload.name;
  }
  if (payload.settings && typeof payload.settings === "object") {
    if (payload.settings.defaultInterviewDurationMinutes !== undefined) {
      organization.settings.defaultInterviewDurationMinutes = Number(
        payload.settings.defaultInterviewDurationMinutes,
      );
    }
    if (payload.settings.recordingEnabled !== undefined) {
      organization.settings.recordingEnabled = Boolean(
        payload.settings.recordingEnabled,
      );
    }
    if (Array.isArray(payload.settings.allowedLanguages)) {
      organization.settings.allowedLanguages =
        payload.settings.allowedLanguages;
    }
    if (payload.settings.dataRetentionDays !== undefined) {
      organization.settings.dataRetentionDays = Number(
        payload.settings.dataRetentionDays,
      );
    }
  }
  await organization.save();
  return organization;
}

export { notFound };
