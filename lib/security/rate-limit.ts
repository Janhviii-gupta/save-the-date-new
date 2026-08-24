import { createHmac } from "node:crypto";
import { getServerEnvironment } from "@/lib/env";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function anonymizedRequestKey(value: string): string {
  return createHmac("sha256", getServerEnvironment().INVITATION_SESSION_SECRET)
    .update(value)
    .digest("hex");
}

export function enforceRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}
