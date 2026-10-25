/**
 * Public user DTO. Never includes password hashes or session secrets.
 *
 * @param {import('mongoose').Document | Record<string, any>} user
 */
export function serializeUser(user) {
  if (!user) return null;
  const id = user.id || user._id;
  return {
    id: String(id),
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl || "",
    emailVerifiedAt: user.emailVerifiedAt || null,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
