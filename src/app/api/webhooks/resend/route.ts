import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { verifyResendWebhook } from "@/lib/email";

const eventSchema = z.object({ type: z.string().max(100), created_at: z.string().datetime(), data: z.object({ email_id: z.string().min(1).max(200) }) });
const trackedEvents = new Set(["email.sent", "email.delivered", "email.delivery_delayed", "email.bounced", "email.failed", "email.complained"]);

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 256 * 1024) return NextResponse.json({ error: "Payload too large." }, { status: 413, headers: { "Cache-Control": "no-store" } });
  const raw = await request.text();
  let verified: unknown;
  try {
    verified = verifyResendWebhook(raw, request.headers.get("svix-id"), request.headers.get("svix-timestamp"), request.headers.get("svix-signature"));
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const parsed = eventSchema.safeParse(verified);
  if (!parsed.success || !trackedEvents.has(parsed.data.type)) return new Response(null, { status: 204 });
  try {
    await getPrisma().emailProviderEvent.create({ data: { providerEventId: request.headers.get("svix-id") ?? "", providerMessageId: parsed.data.data.email_id, eventType: parsed.data.type, occurredAt: new Date(parsed.data.created_at) } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return new Response(null, { status: 204 });
    return NextResponse.json({ error: "Webhook event could not be stored." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
  return new Response(null, { status: 204 });
}
