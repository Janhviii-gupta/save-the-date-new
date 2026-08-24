import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/202608200001_initial_schema.sql"), "utf8");
const rsvpMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/202608200002_rsvp_transaction.sql"), "utf8");

describe("database privacy and idempotency foundation", () => {
  it("contains the approved tables and no out-of-scope wedding-management fields", () => {
    for (const table of [
      "households",
      "invitations",
      "anonymous_sessions",
      "rsvp",
      "rsvp_history",
      "experience_events",
      "rsvp_idempotency_keys",
      "admin_profiles",
      "admin_audit_log"
    ]) {
      expect(migration).toContain(`public.${table}`);
    }
    for (const forbiddenField of ["plus_one", "plus_one_count", "additional_guest", "children", "accommodation", "meal_preference", "event_attendance"]) {
      expect(migration).not.toContain(forbiddenField);
    }
  });

  it("uses a transaction function with an idempotency record and RSVP history", () => {
    expect(rsvpMigration).toContain("create or replace function public.submit_rsvp");
    expect(rsvpMigration).toContain("rsvp_idempotency_keys");
    expect(rsvpMigration).toContain("rsvp_history");
  });
});

