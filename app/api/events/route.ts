import { NextRequest, NextResponse } from "next/server";
import { getSessionHashFromCookie } from "@/lib/security/session";
import { anonymizedRequestKey, enforceRateLimit } from "@/lib/security/rate-limit";
import { getAdminSupabase, isSupabaseConfigured, memoryStore } from "@/lib/supabase/admin";
import { clientEventSchema } from "@/lib/validation/analytics";

export async function POST(request: NextRequest) {
  const body = clientEventSchema.safeParse(await request.json().catch(() => null));
  const sessionHash = await getSessionHashFromCookie();
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!body.success || !sessionHash || !enforceRateLimit(anonymizedRequestKey(`event:${forwardedFor}`), 120, 60_000)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    if (!isSupabaseConfigured()) {
      const session = memoryStore.sessions.get(sessionHash);
      if (session) {
        memoryStore.events.push({
          sessionId: session.id,
          eventType: body.data.eventType,
          milestone: body.data.milestone
        });
      }
      return NextResponse.json({ ok: true });
    }

    const supabase = getAdminSupabase();
    const { data: session } = await supabase
      .from("anonymous_sessions")
      .select("id, interaction_started_at")
      .eq("session_hmac", sessionHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (session) {
      if (body.data.eventType === "guest_interaction_started" && !session.interaction_started_at) {
        await supabase
          .from("anonymous_sessions")
          .update({ interaction_started_at: new Date().toISOString() })
          .eq("id", session.id)
          .is("interaction_started_at", null)
          .catch(() => null);
      }

      await supabase.from("experience_events").insert({
        session_id: session.id,
        event_type: body.data.eventType,
        milestone: body.data.milestone,
        metadata: body.data.metadata ?? {}
      }).catch(() => null);
    }
  } catch {
    // Ignore logging errors
  }

  return NextResponse.json({ ok: true });
}
