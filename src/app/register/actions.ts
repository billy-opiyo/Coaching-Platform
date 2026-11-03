"use server";

import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { enforceAuthRateLimit } from "@/lib/security";
import { sendAccountEmail } from "@/lib/email";
import { isAccountEmailAvailable, isSignupAvailable } from "@/lib/auth-config";

export type FormState = { message: string; success: boolean };
const passwordSchema = z.string().min(12).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72);
const registrationSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.email().trim().toLowerCase().max(254),
  password: passwordSchema,
});
const GENERIC_SUCCESS: FormState = { success: true, message: "If registration is available for this address, a verification email will arrive shortly." };

export async function registerAccount(_previous: FormState, formData: FormData): Promise<FormState> {
  if (!isSignupAvailable()) return { success: false, message: "Account registration is not open yet." };
  const parsed = registrationSchema.safeParse({ name: formData.get("name") || undefined, email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { success: false, message: "Check the form. Use a valid email address and a password of at least 12 characters." };
  const { name, email, password } = parsed.data;
  try {
    if (!(await enforceAuthRateLimit(email))) return GENERIC_SUCCESS;
    const db = getPrisma();
    const existing = await db.user.findUnique({ where: { email }, select: { id: true, emailVerified: true, disabledAt: true } });
    if (existing?.emailVerified || existing?.disabledAt) return GENERIC_SUCCESS;
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const passwordHash = await hash(password, 12);
    await db.$transaction(async (tx) => {
      if (!existing) await tx.user.create({ data: { email, name: name || null, passwordHash } });
      await tx.verificationToken.updateMany({ where: { email, consumedAt: null }, data: { consumedAt: new Date() } });
      await tx.verificationToken.create({ data: { email, tokenHash, expiresAt: new Date(Date.now() + 30 * 60_000) } });
    });
    await sendAccountEmail(email, "Verify your account", "Confirm your email", "Please verify your email address to finish setting up your account.", rawToken, "/verify-email");
    return GENERIC_SUCCESS;
  } catch {
    return GENERIC_SUCCESS;
  }
}

export async function verifyEmail(_previous: FormState, formData: FormData): Promise<FormState> {
  const rawToken = String(formData.get("token") ?? "");
  if (rawToken.length < 30 || rawToken.length > 100) return { success: false, message: "This verification link is invalid or expired." };
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  try {
    const db = getPrisma();
    const token = await db.verificationToken.findUnique({ where: { tokenHash } });
    if (!token || token.consumedAt || token.expiresAt <= new Date()) return { success: false, message: "This verification link is invalid or expired." };
    await db.$transaction(async (tx) => {
      const consume = await tx.verificationToken.updateMany({ where: { id: token.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
      if (consume.count !== 1) throw new Error("Verification token was already used.");
      await tx.user.updateMany({ where: { email: token.email, emailVerified: null }, data: { emailVerified: new Date() } });
    });
    return { success: true, message: "Email verified. You can now sign in." };
  } catch {
    return { success: false, message: "This verification link is invalid or expired." };
  }
}

const emailSchema = z.email().trim().toLowerCase().max(254);
export async function requestPasswordReset(_previous: FormState, formData: FormData): Promise<FormState> {
  if (!isAccountEmailAvailable()) return { success: false, message: "Password recovery is not configured yet." };
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { success: false, message: "Enter a valid email address." };
  try {
    if (!(await enforceAuthRateLimit(parsed.data))) return GENERIC_SUCCESS;
    const db = getPrisma();
    const user = await db.user.findUnique({ where: { email: parsed.data }, select: { id: true, email: true, disabledAt: true } });
    if (user && !user.disabledAt) {
      const rawToken = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      await db.$transaction(async (tx) => {
        await tx.passwordResetToken.updateMany({ where: { userId: user.id, consumedAt: null }, data: { consumedAt: new Date() } });
        await tx.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60_000) } });
      });
      await sendAccountEmail(user.email, "Reset your password", "Password reset requested", "Use this link within 30 minutes to choose a new password.", rawToken, "/reset-password");
    }
    return GENERIC_SUCCESS;
  } catch {
    return GENERIC_SUCCESS;
  }
}

export async function resetPassword(_previous: FormState, formData: FormData): Promise<FormState> {
  const tokenValue = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const parsed = passwordSchema.safeParse(password);
  if (tokenValue.length < 30 || tokenValue.length > 100 || !parsed.success) return { success: false, message: "This link or password is invalid. Use at least 12 characters." };
  try {
    const db = getPrisma();
    const tokenHash = createHash("sha256").update(tokenValue).digest("hex");
    const token = await db.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!token || token.consumedAt || token.expiresAt <= new Date()) return { success: false, message: "This password reset link is invalid or expired." };
    const passwordHash = await hash(password, 12);
    await db.$transaction(async (tx) => {
      const consume = await tx.passwordResetToken.updateMany({ where: { id: token.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
      if (consume.count !== 1) throw new Error("Reset token was already used.");
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } });
    });
    return { success: true, message: "Password updated. You can sign in with your new password." };
  } catch {
    return { success: false, message: "This password reset link is invalid or expired." };
  }
}
