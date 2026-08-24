import { z } from "zod";

export const clientEventSchema = z.object({
  eventType: z.enum([
    "invitation_link_opened",
    "anonymous_session_started",
    "guest_interaction_started",
    "screen_viewed",
    "system_scan_started",
    "match_found",
    "reveal_reached",
    "installation_started",
    "installation_reached",
    "warning_viewed",
    "rsvp_selected",
    "name_submitted",
    "attendance_count_selected",
    "rsvp_completed",
    "rsvp_changed",
    "easter_egg_triggered",
    "returning_visit"
  ]),
  milestone: z.string().max(64).optional(),
  metadata: z.record(z.string(), z.string().max(120)).optional()
});

export type ClientEvent = z.infer<typeof clientEventSchema>;

