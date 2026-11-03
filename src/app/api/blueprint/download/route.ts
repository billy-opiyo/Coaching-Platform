import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { getPrivateBlueprintFile, isBlueprintCaptureAvailable } from "@/lib/blueprint-config";
import { hashEmailToken, verifyBlueprintAccessToken } from "@/lib/email-tokens";
import { getPrisma } from "@/lib/prisma";

const payloadSchema = z.object({ token: z.string().min(40).max(400) });

export async function POST(request: Request) {
  if (!(await isBlueprintCaptureAvailable())) return NextResponse.json({ error: "Guide access is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  let json: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 1000) return NextResponse.json({ error: "Invalid request." }, { status: 413, headers: { "Cache-Control": "no-store" } });
    json = JSON.parse(raw) as unknown;
  } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: { "Cache-Control": "no-store" } }); }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid or expired link." }, { status: 400 });
  const token = parsed.data.token;
  const access = verifyBlueprintAccessToken(token);
  if (!access) return NextResponse.json({ error: "Invalid or expired link." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  try {
    const delivery = await getPrisma().blueprintDelivery.findUnique({ where: { tokenHash: hashEmailToken(token) }, select: { id: true, leadId: true, guideVersion: true, tokenExpiresAt: true, status: true, downloadCount: true } });
    if (!delivery || delivery.leadId !== access.leadId || delivery.guideVersion !== access.guideVersion || delivery.status !== "SENT" || delivery.tokenExpiresAt <= new Date() || delivery.downloadCount >= 10) {
      return NextResponse.json({ error: "Invalid or expired link." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    const claimed = await getPrisma().blueprintDelivery.updateMany({ where: { id: delivery.id, downloadCount: { lt: 10 }, tokenExpiresAt: { gt: new Date() } }, data: { downloadCount: { increment: 1 } } });
    if (claimed.count !== 1) return NextResponse.json({ error: "Invalid or expired link." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    const resolved = await getPrivateBlueprintFile();
    if (!resolved) return NextResponse.json({ error: "Guide access is unavailable." }, { status: 503 });
    const pdf = await readFile(resolved);
    if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") return NextResponse.json({ error: "Guide access is unavailable." }, { status: 503 });
    return new Response(pdf, { status: 200, headers: { "Content-Type": "application/pdf", "Content-Length": String(pdf.byteLength), "Content-Disposition": "attachment; filename=\"7-day-blueprint.pdf\"", "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" } });
  } catch {
    return NextResponse.json({ error: "Guide access is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
