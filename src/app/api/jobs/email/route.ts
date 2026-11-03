import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processEmailQueue } from "@/lib/email-queue";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expectedBytes = Buffer.from(`Bearer ${secret}`);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    return NextResponse.json(await processEmailQueue(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Email queue processing failed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
