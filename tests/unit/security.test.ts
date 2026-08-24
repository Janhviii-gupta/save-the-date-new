import { beforeEach, describe, expect, it } from "vitest";
import { invitationSessionCookieOptions } from "@/lib/security/session";
import { generateOpaqueToken, hmacSessionToken, isValidOpaqueToken } from "@/lib/security/token";

beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = "https://example.test";
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.INVITATION_SESSION_SECRET = "b".repeat(32);
});

describe("anonymous session token handling", () => {
  it("creates valid 256-bit opaque tokens", () => {
    const token = generateOpaqueToken();
    expect(token).toHaveLength(43);
    expect(isValidOpaqueToken(token)).toBe(true);
    expect(generateOpaqueToken()).not.toBe(token);
  });

  it("rejects malformed tokens and produces a fixed 64-char hex HMAC", () => {
    expect(isValidOpaqueToken("guest-name@example.com")).toBe(false);
    expect(isValidOpaqueToken("short")).toBe(false);
    expect(hmacSessionToken(generateOpaqueToken())).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("invitation session cookie configuration", () => {
  it("uses a restricted HttpOnly cookie with lax sameSite", () => {
    const options = invitationSessionCookieOptions();
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
  });
});

