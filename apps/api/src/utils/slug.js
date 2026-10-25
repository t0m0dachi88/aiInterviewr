import crypto from "node:crypto";

/**
 * Convert a display name into a URL-safe slug.
 *
 * @param {string} name
 * @returns {string}
 */
export function slugify(name) {
  const slug = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "org";
}

/**
 * Append a short unique suffix when a slug collides.
 *
 * @param {string} base
 * @returns {string}
 */
export function uniqueSlug(base) {
  const suffix = crypto.randomBytes(3).toString("hex");
  const trimmed = base.slice(0, 40).replace(/-+$/g, "");
  return `${trimmed}-${suffix}`;
}
