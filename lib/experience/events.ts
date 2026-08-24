export type ExperienceEventType =
  | "invitation_link_opened"
  | "anonymous_session_started"
  | "guest_interaction_started"
  | "screen_viewed"
  | "system_scan_started"
  | "match_found"
  | "reveal_reached"
  | "installation_started"
  | "installation_reached"
  | "warning_viewed"
  | "rsvp_selected"
  | "name_submitted"
  | "attendance_count_selected"
  | "rsvp_completed"
  | "rsvp_changed"
  | "easter_egg_triggered"
  | "returning_visit";

export async function trackExperienceEvent(
  eventType: ExperienceEventType,
  milestone?: string,
  metadata?: Record<string, string>
) {
  await fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventType, milestone, metadata }),
    keepalive: true
  }).catch(() => undefined);
}

