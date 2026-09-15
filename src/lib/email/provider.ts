import "server-only";

/**
 * Provider-agnostic email send interface (Advanced 6 §2). Nothing in
 * lib/data/notifications.ts (or any workflow function that calls it) knows
 * or cares which concrete provider is behind this — swapping providers
 * later means writing one new class here, not touching the workflow.
 *
 * No provider is configured in this project today (no email SDK in
 * package.json, no provider env vars in .env.example before this stage).
 * Per the ticket: do NOT invent API keys/credentials. What this file adds:
 *
 *   - The interface itself (EmailProvider / EmailMessage / EmailSendResult).
 *   - ResendEmailProvider — a ready-to-use adapter for Resend
 *     (https://resend.com), chosen because it's a plain HTTPS POST with no
 *     SDK dependency to install, and is the most common zero-config choice
 *     for a Vercel/Next.js app like this one. It only ever runs if
 *     RESEND_API_KEY is actually set — nothing is fabricated.
 *   - NullEmailProvider — the default when no provider is configured.
 *     Logs what WOULD have been sent (useful in local dev) but always
 *     returns ok:false, so a notification is honestly recorded as "failed"
 *     rather than silently/incorrectly marked "sent". This is what the
 *     ticket's "do not claim delivery unless the provider confirms it"
 *     requirement means in practice for a fresh install.
 *
 * Required environment variables to actually send email (see .env.example):
 *   RESEND_API_KEY      - Resend API key. Unset = NullEmailProvider is used.
 *   EMAIL_FROM_ADDRESS or RESEND_FROM_EMAIL
 *                       - any verified "from" address in your Resend account.
 *   EMAIL_FROM_NAME     - optional display name, defaults to Salem Medical Laboratories.
 *   EMAIL_FALLBACK_ADDRESS or RESEND_FALLBACK_FROM_EMAIL
 *                       - optional verified Resend sender used once if the
 *                         primary sender fails.
 *   NEXT_PUBLIC_SITE_URL - absolute base URL used to build links inside
 *                          emails (e.g. https://salemmedicallabs.com).
 *                          Unset = links fall back to a relative path,
 *                          which most email clients will not resolve, so
 *                          this should be set before enabling a real
 *                          provider.
 */

export interface EmailAttachment {
  filename: string;
  /** Base64-encoded file content for the Resend HTTPS API. */
  contentBase64: string;
  contentType?: string;
}

export interface EmailMessage {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

export interface EmailSendResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
}

class NullEmailProvider implements EmailProvider {
  readonly name = "none";

  async send(message: EmailMessage): Promise<EmailSendResult> {
    console.warn(
      `[email] No provider configured (set RESEND_API_KEY + EMAIL_FROM_ADDRESS (or RESEND_FROM_EMAIL)) — would have sent "${message.subject}" to ${message.to}.`
    );
    return { ok: false, error: "No email provider is configured." };
  }
}

class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string,
    private readonly fromName: string,
    private readonly fallbackFromAddress?: string
  ) {}

  private async sendFrom(message: EmailMessage, fromAddress: string): Promise<EmailSendResult> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${this.fromName} <${fromAddress}>`,
          to: message.toName ? `${message.toName} <${message.to}>` : message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.attachments?.length
            ? {
                attachments: message.attachments.map((attachment) => ({
                  filename: attachment.filename,
                  content: attachment.contentBase64,
                  content_type: attachment.contentType ?? "application/octet-stream",
                })),
              }
            : {}),
        }),
      });

      const body = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;

      if (!response.ok) {
        return { ok: false, error: body?.message ?? `Resend responded with HTTP ${response.status}.` };
      }
      if (!body?.id) {
        return { ok: false, error: "Resend accepted the request but returned no message id." };
      }
      return { ok: true, providerMessageId: body.id };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Unknown email send error." };
    }
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const primary = await this.sendFrom(message, this.fromAddress);
    if (primary.ok) return primary;

    // If the primary sender is rejected by Resend (for example because its
    // domain/sender is temporarily unavailable), retry once with the optional
    // fallback sender. This keeps patient notifications working without
    // changing the recipient or message content.
    if (this.fallbackFromAddress && this.fallbackFromAddress !== this.fromAddress) {
      console.warn(`[email] Primary sender failed; retrying with fallback sender: ${primary.error ?? "unknown error"}`);
      const fallback = await this.sendFrom(message, this.fallbackFromAddress);
      if (fallback.ok) return fallback;
      return {
        ok: false,
        error: `Primary sender failed: ${primary.error ?? "unknown error"}. Fallback sender also failed: ${fallback.error ?? "unknown error"}.`,
      };
    }

    return primary;
  }
}

/**
 * Resolves the active provider from environment configuration. Called
 * fresh on every send (not memoized at module scope) so a provider added
 * to the environment takes effect without a redeploy-triggered cold start
 * being the only way to pick it up in serverless.
 */
export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  // Set either EMAIL_FROM_ADDRESS or RESEND_FROM_EMAIL in Vercel. The value
  // is intentionally not hard-coded, so any sender address verified in the
  // connected Resend account can be used without changing application code.
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.RESEND_FROM_EMAIL;
  const fallbackFromAddress =
    process.env.EMAIL_FALLBACK_ADDRESS || process.env.RESEND_FALLBACK_FROM_EMAIL;

  if (apiKey && fromAddress) {
    return new ResendEmailProvider(
      apiKey,
      fromAddress,
      process.env.EMAIL_FROM_NAME || "Salem Medical Laboratories",
      fallbackFromAddress
    );
  }
  return new NullEmailProvider();
}

/** Absolute base URL for links inside emails. See NEXT_PUBLIC_SITE_URL above. */
export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
}
