import "server-only";
import { open, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { isInsideDirectory } from "@/lib/blueprint-path-policy";

export const BLUEPRINT_SEQUENCE_KEY = "blueprint-onboarding";

export function getBlueprintRetentionDays(): number | null {
  const value = Number(process.env.BLUEPRINT_RETENTION_DAYS);
  return Number.isInteger(value) && value >= 1 && value <= 3650 ? value : null;
}

export async function getPrivateBlueprintFile(): Promise<string | null> {
  const file = process.env.BLUEPRINT_FILE_PATH;
  if (!file || !path.isAbsolute(file)) return null;
  try {
    const resolved = await realpath(file);
    const publicDirectory = await realpath(path.join(process.cwd(), "public"));
    if (isInsideDirectory(publicDirectory, resolved)) return null;
    const info = await stat(resolved);
    if (!info.isFile() || info.size < 5 || info.size > 25 * 1024 * 1024) return null;
    const handle = await open(resolved, "r");
    try {
      const header = Buffer.alloc(5);
      const { bytesRead } = await handle.read(header, 0, 5, 0);
      return bytesRead === 5 && header.toString("ascii") === "%PDF-" ? resolved : null;
    } finally {
      await handle.close();
    }
  } catch {
    return null;
  }
}

export async function isBlueprintCaptureAvailable(): Promise<boolean> {
  const ready = process.env.BLUEPRINT_CONSENT_APPROVED === "true"
    && Boolean(process.env.BLUEPRINT_CONSENT_VERSION)
    && getBlueprintRetentionDays() !== null
    && Boolean(process.env.DATABASE_URL && process.env.AUTH_SECRET && process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.APP_URL && process.env.CRON_SECRET && process.env.RESEND_WEBHOOK_SECRET);
  if (!ready) return false;
  try {
    const appUrl = new URL(process.env.APP_URL ?? "");
    if (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:") return false;
  } catch {
    return false;
  }
  return Boolean(await getPrivateBlueprintFile());
}
