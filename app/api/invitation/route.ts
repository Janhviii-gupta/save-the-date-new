import { NextResponse } from "next/server";
import {
  getSessionHashFromCookie,
  getRawSessionTokenFromCookie,
  invitationSessionCookieOptions,
  INVITATION_SESSION_COOKIE,
  INVITATION_SESSION_MAX_AGE_SECONDS
} from "@/lib/security/session";
import { generateOpaqueToken, hmacSessionToken } from "@/lib/security/token";
import { getAdminSupabase, isSupabaseConfigured, memoryStore } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const rawToken = await getRawSessionTokenFromCookie();
    const sessionHash = rawToken ? hmacSessionToken(rawToken) : null;

    if (!isSupabaseConfigured()) {
      // Fast in-memory resolution for local development
      if (sessionHash && memoryStore.sessions.has(sessionHash)) {
        const session = memoryStore.sessions.get(sessionHash)!;
        const currentRsvp = memoryStore.rsvps.get(session.id);

        const response = NextResponse.json({
          mode: currentRsvp ? "returning" : "first_time",
          currentRsvp: currentRsvp?.response ?? null,
          submittedName: currentRsvp?.submittedName ?? null,
          attendanceCount: currentRsvp?.attendanceCount ?? null
        });
        response.headers.set("Cache-Control", "no-store");
        return response;
      }

      const newRawToken = generateOpaqueToken();
      const newSessionHash = hmacSessionToken(newRawToken);
      const newId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + INVITATION_SESSION_MAX_AGE_SECONDS * 1_000).toISOString();

      memoryStore.sessions.set(newSessionHash, { id: newId, expiresAt });
      memoryStore.events.push({ sessionId: newId, eventType: "anonymous_session_started" });

      const response = NextResponse.json({
        mode: "first_time",
        currentRsvp: null,
        submittedName: null,
        attendanceCount: null
      });

      response.cookies.set(INVITATION_SESSION_COOKIE, newRawToken, invitationSessionCookieOptions());
      response.headers.set("Cache-Control", "no-store");
      return response;
    }

    // Live Supabase path
    const supabase = getAdminSupabase();

    if (sessionHash) {
      const { data: session } = await supabase
        .from("anonymous_sessions")
        .select("id")
        .eq("session_hmac", sessionHash)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (session) {
        const { data: currentRsvp } = await supabase
          .from("rsvp")
          .select("response, submitted_name, attendance_count")
          .eq("session_id", session.id)
          .maybeSingle();

        const response = NextResponse.json({
          mode: currentRsvp ? "returning" : "first_time",
          currentRsvp: currentRsvp?.response ?? null,
          submittedName: currentRsvp?.submitted_name ?? null,
          attendanceCount: currentRsvp?.attendance_count ?? null
        });
        response.headers.set("Cache-Control", "no-store");
        return response;
      }
    }

    const newRawToken = generateOpaqueToken();
    const newSessionHash = hmacSessionToken(newRawToken);
    const expiresAt = new Date(Date.now() + INVITATION_SESSION_MAX_AGE_SECONDS * 1_000).toISOString();

    const { data: newSession } = await supabase
      .from("anonymous_sessions")
      .insert({
        session_hmac: newSessionHash,
        expires_at: expiresAt
      })
      .select("id")
      .maybeSingle();

    if (newSession) {
      await supabase.from("experience_events").insert({
        session_id: newSession.id,
        event_type: "anonymous_session_started"
      }).catch(() => null);
    }

    const response = NextResponse.json({
      mode: "first_time",
      currentRsvp: null,
      submittedName: null,
      attendanceCount: null
    });

    response.cookies.set(INVITATION_SESSION_COOKIE, newRawToken, invitationSessionCookieOptions());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    const fallbackToken = generateOpaqueToken();
    const response = NextResponse.json({
      mode: "first_time",
      currentRsvp: null,
      submittedName: null,
      attendanceCount: null
    });
    response.cookies.set(INVITATION_SESSION_COOKIE, fallbackToken, invitationSessionCookieOptions());
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
