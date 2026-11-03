import "server-only";
import { Resend } from "resend";

export function baseUrl(): string {
  const value = process.env.APP_URL;
  if (!value) throw new Error("APP_URL is not configured.");
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("Production email links must use HTTPS.");
  return url.origin;
}

export async function sendAccountEmail(to: string, subject: string, title: string, message: string, token: string, path: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Account email delivery is not configured.");
  const url = new URL(path, baseUrl());
  url.hash = `token=${encodeURIComponent(token)}`;
  const link = url.toString();
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    subject,
    text: `${title}\n\n${message}\n\n${link}\n\nIf you did not request this email, you can ignore it.`,
    html: `<main style="font-family:Arial,sans-serif;color:#172033;line-height:1.65"><p style="font-size:12px;letter-spacing:1px;color:#236f69;text-transform:uppercase">Coaching Platform</p><h1 style="font-size:24px">${title}</h1><p>${message}</p><p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#d7f4ef;color:#101827;text-decoration:none;border-radius:6px;font-weight:bold">Continue securely</a></p><p style="font-size:13px;color:#64748b">If you did not request this email, you can ignore it.</p></main>`,
  });
  if (result.error) throw new Error("Account email delivery failed.");
}

export async function sendTextEmail(to: string, subject: string, text: string, idempotencyKey: string): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email delivery is not configured.");
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({ from, to, subject, text }, { idempotencyKey });
  if (result.error || !result.data?.id) throw new Error("Email delivery failed.");
  return result.data.id;
}

export function verifyResendWebhook(payload: string, id: string | null, timestamp: string | null, signature: string | null) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret || !id || !timestamp || !signature) throw new Error("Webhook verification is not configured.");
  const resend = new Resend();
  return resend.webhooks.verify({ payload, headers: { id, timestamp, signature }, webhookSecret: secret });
}
