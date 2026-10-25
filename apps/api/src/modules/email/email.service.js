import { env } from "../../config/env.js";

/**
 * Provider-agnostic email abstraction.
 * No provider is tightly coupled. When SMTP_URL / EMAIL_FROM are unset,
 * messages are not sent and callers receive delivered=false.
 *
 * A future provider (Resend, SES, SMTP) should implement `send` with the
 * same { to, subject, text, html } contract.
 */

function isConfigured() {
  return Boolean(env.SMTP_URL && env.EMAIL_FROM);
}

export function getEmailStatus() {
  return {
    configured: isConfigured(),
    from: env.EMAIL_FROM || null,
  };
}

/**
 * @param {{ to: string, subject: string, text: string, html?: string }} message
 * @returns {Promise<{ delivered: boolean, reason?: string }>}
 */
export async function sendEmail(message) {
  if (!message?.to || !message?.subject || !message?.text) {
    return { delivered: false, reason: "invalid_message" };
  }

  if (!isConfigured()) {
    if (!env.isProduction && env.LOG_LEVEL !== "silent") {
      // eslint-disable-next-line no-console
      console.info("[email] Provider not configured. Message was not sent.", {
        to: message.to,
        subject: message.subject,
      });
    }
    return { delivered: false, reason: "email_provider_not_configured" };
  }

  // SMTP transport is intentionally not implemented in Phase 1.
  // Configure SMTP_URL and a provider adapter before enabling delivery.
  if (!env.isProduction && env.LOG_LEVEL !== "silent") {
    // eslint-disable-none
    // eslint-disable-next-line no-console
    console.warn(
      "[email] SMTP_URL is set but no provider adapter is wired yet. Message was not sent.",
    );
  }
  return { delivered: false, reason: "email_provider_not_implemented" };
}

export function buildInvitationEmail({ organizationName, role, acceptUrl }) {
  const subject = `You were invited to join ${organizationName} on HirePulse`;
  const text = [
    `You have been invited to join ${organizationName} as ${role}.`,
    `Accept the invitation (sign in with this email address): ${acceptUrl}`,
    "If you did not expect this invitation, you can ignore this message.",
  ].join("\n\n");
  const html = `<p>You have been invited to join <strong>${escapeHtml(organizationName)}</strong> as <strong>${escapeHtml(role)}</strong>.</p><p><a href="${escapeHtml(acceptUrl)}">Accept invitation</a></p><p>If you did not expect this invitation, you can ignore this message.</p>`;
  return { subject, text, html };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
