export type ConsentSnapshot = { id: string; action: "OPT_IN" | "OPT_OUT"; consentVersion: string };

export function consentAllowsSend(latest: ConsentSnapshot | null, enrollment: { consentEventId: string; consentVersion: string }): boolean {
  return latest?.action === "OPT_IN" && latest.id === enrollment.consentEventId && latest.consentVersion === enrollment.consentVersion;
}

export function isEmailTemplateReady(subject: string, bodyText: string): boolean {
  return subject.trim().length >= 3 && bodyText.trim().length >= 30 && !subject.startsWith("[Draft]") && !bodyText.startsWith("[Draft]");
}

export function canRetryEmail(attempts: number, createdAt: Date, now: Date, maxAttempts = 5, providerWindowMs = 23 * 60 * 60_000): boolean {
  return attempts < maxAttempts && now.getTime() - createdAt.getTime() < providerWindowMs;
}

export function scheduleEmailStep(startedAt: Date, delayDays: number): Date {
  return new Date(startedAt.getTime() + delayDays * 24 * 60 * 60_000);
}
