import { createHmac, randomBytes } from "node:crypto";
import { getServerEnvironment } from "@/lib/env";

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateOpaqueToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function isValidOpaqueToken(value: string): boolean {
  return TOKEN_PATTERN.test(value);
}

export function hmacSessionToken(value: string): string {
  return createHmac("sha256", getServerEnvironment().INVITATION_SESSION_SECRET)
    .update(value)
    .digest("hex");
}

