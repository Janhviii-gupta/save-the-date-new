import { cookies } from "next/headers";
import { hmacSessionToken } from "@/lib/security/token";

export const INVITATION_SESSION_COOKIE = "jk_std_session";
export const INVITATION_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 60; // 60 days

export function invitationSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: INVITATION_SESSION_MAX_AGE_SECONDS
  };
}

export async function getRawSessionTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(INVITATION_SESSION_COOKIE)?.value ?? null;
}

export async function getSessionHashFromCookie(): Promise<string | null> {
  const rawSession = await getRawSessionTokenFromCookie();
  return rawSession ? hmacSessionToken(rawSession) : null;
}

