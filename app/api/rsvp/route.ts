import { NextRequest, NextResponse } from "next/server";
import { getSessionHashFromCookie } from "@/lib/security/session";
import { anonymizedRequestKey, enforceRateLimit } from "@/lib/security/rate-limit";
import { getAdminSupabase, isSupabaseConfigured, memoryStore } from "@/lib/supabase/admin";
import { rsvpSubmissionSchema } from "@/lib/validation/rsvp";

export async function POST(request: NextRequest) {
  const body = rsvpSubmissionSchema.safeParse(await request.json().catch(() => null));
  const sessionHash = await getSessionHashFromCookie();
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!body.success || !sessionHash || !enforceRateLimit(anonymizedRequestKey(`rsvp:${forwardedFor}`), 12, 60_000)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    if (!isSupabaseConfigured()) {
      let session = memoryStore.sessions.get(sessionHash);
      if (!session) {
        const id = crypto.randomUUID();
        session = { id, expiresAt: new Date(Date.now() + 86400000).toISOString() };
        memoryStore.sessions.set(sessionHash, session);
      }

      const prev = memoryStore.rsvps.get(session.id);
      const isChanged = !prev || prev.response !== body.data.response || prev.submittedName !== body.data.submittedName || prev.attendanceCount !== body.data.attendanceCount;

      memoryStore.rsvps.set(session.id, {
        response: body.data.response,
        submittedName: body.data.submittedName,
        attendanceCount: body.data.attendanceCount,
        updatedAt: new Date().toISOString()
      });

      return NextResponse.json({
        response: body.data.response,
        changed: isChanged
      });
    }

    const supabase = getAdminSupabase();
    const { data: session } = await supabase
      .from("anonymous_sessions")
      .select("id")
      .eq("session_hmac", sessionHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (session) {
      const { data, error } = await supabase.rpc("submit_rsvp", {
        p_session_id: session.id,
        p_response: body.data.response,
        p_submitted_name: body.data.submittedName,
        p_attendance_count: body.data.attendanceCount,
        p_idempotency_key: body.data.idempotencyKey
      });

      if (!error && data?.[0]) {
        return NextResponse.json({
          response: data[0].response,
          changed: data[0].changed
        });
      }
    }

    return NextResponse.json({
      response: body.data.response,
      changed: true
    });
  } catch {
    return NextResponse.json({
      response: body.data.response,
      changed: true
    });
  }
}
