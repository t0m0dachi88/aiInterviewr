export function serializeOrganization(organization, role) {
  return {
    id: String(organization._id),
    name: organization.name,
    slug: organization.slug,
    ownerUserId: String(organization.ownerUserId),
    status: organization.status,
    role: role || undefined,
    settings: {
      defaultInterviewDurationMinutes:
        organization.settings?.defaultInterviewDurationMinutes ?? 60,
      recordingEnabled: Boolean(organization.settings?.recordingEnabled),
      allowedLanguages: organization.settings?.allowedLanguages || [
        "javascript",
        "python",
        "cpp",
      ],
      dataRetentionDays: organization.settings?.dataRetentionDays ?? 365,
    },
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
  };
}

export function serializeMembership(membership, user) {
  return {
    id: String(membership._id),
    organizationId: String(membership.organizationId),
    userId: String(membership.userId),
    role: membership.role,
    status: membership.status,
    invitedBy: membership.invitedBy ? String(membership.invitedBy) : null,
    user: user
      ? {
          id: String(user._id || user.id),
          email: user.email,
          displayName: user.displayName,
        }
      : undefined,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
  };
}

export function serializeInvitation(invitation) {
  return {
    id: String(invitation._id),
    organizationId: String(invitation.organizationId),
    email: invitation.email,
    invitedRole: invitation.invitedRole,
    status: invitation.status,
    invitedBy: String(invitation.invitedBy),
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
    revokedAt: invitation.revokedAt,
    createdAt: invitation.createdAt,
  };
}
