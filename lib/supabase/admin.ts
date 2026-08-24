import { createClient } from "@supabase/supabase-js";
import { getServerEnvironment } from "@/lib/env";

export function isSupabaseConfigured(): boolean {
  try {
    const env = getServerEnvironment();
    return (
      Boolean(env.SUPABASE_URL) &&
      !env.SUPABASE_URL.includes("placeholder") &&
      Boolean(env.SUPABASE_SERVICE_ROLE_KEY) &&
      env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-service-key"
    );
  } catch {
    return false;
  }
}

export function getAdminSupabase() {
  const environment = getServerEnvironment();

  return createClient(environment.SUPABASE_URL, environment.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// In-memory fallback store for local development and offline preview
type MemoryRsvp = {
  response: "yes" | "maybe" | "no";
  submittedName: string;
  attendanceCount: number | null;
  updatedAt: string;
};

const memorySessions = new Map<string, { id: string; expiresAt: string }>();
const memoryRsvps = new Map<string, MemoryRsvp>();
const memoryEvents: Array<{ sessionId: string; eventType: string; milestone?: string }> = [];

export const memoryStore = {
  sessions: memorySessions,
  rsvps: memoryRsvps,
  events: memoryEvents
};
