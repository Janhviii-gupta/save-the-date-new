import type { RsvpResponse } from "@/lib/validation/rsvp";

export type NarrativeState =
  | "entry"
  | "date_19"
  | "date_20"
  | "november"
  | "year_2026"
  | "jaipur"
  | "incident"
  | "cooking"
  | "bite"
  | "information_request"
  | "system_scan"
  | "match_found"
  | "reveal"
  | "application_detected"
  | "compatibility"
  | "installation"
  | "warning";

export type RsvpInteractiveState =
  | "rsvp_choice"
  | "rsvp_name"
  | "rsvp_count"
  | "rsvp_count_custom"
  | "outcome_yes"
  | "outcome_maybe"
  | "outcome_no"
  | "returning"
  | "rsvp_change";

export type ExperienceState = NarrativeState | RsvpInteractiveState;

export type ExperienceEvent =
  | { type: "AUTO_ADVANCE" }
  | { type: "CONTINUE" }
  | { type: "VIEW_INSTALLATION" }
  | { type: "CHOOSE_DECISION"; response: RsvpResponse }
  | { type: "SUBMIT_NAME"; name: string; response: RsvpResponse }
  | { type: "SELECT_COUNT"; count: number | "more"; response: RsvpResponse }
  | { type: "SUBMIT_CUSTOM_COUNT"; count: number; response: RsvpResponse }
  | { type: "CHOOSE_RSVP"; response: RsvpResponse } // backward compatibility & direct transitions
  | { type: "CHANGE_RSVP" };

const automaticTransitions: Partial<Record<ExperienceState, ExperienceState>> = {
  entry: "date_19",
  date_19: "date_20",
  date_20: "november",
  november: "year_2026",
  year_2026: "jaipur",
  jaipur: "incident",
  incident: "cooking",
  cooking: "bite",
  bite: "information_request",
  system_scan: "match_found",
  match_found: "reveal",
  compatibility: "installation",
  installation: "warning",
  warning: "rsvp_choice"
};

export function initialExperienceState(currentRsvp: RsvpResponse | null): ExperienceState {
  return currentRsvp ? "returning" : "entry";
}

export function transition(state: ExperienceState, event: ExperienceEvent): ExperienceState {
  if (event.type === "AUTO_ADVANCE") {
    return automaticTransitions[state] ?? state;
  }

  if (event.type === "CONTINUE") {
    if (state === "information_request") return "system_scan";
    if (state === "reveal") return "application_detected";
  }

  if (event.type === "VIEW_INSTALLATION" && state === "application_detected") {
    return "compatibility";
  }

  if (event.type === "CHANGE_RSVP" && state === "returning") {
    return "rsvp_choice";
  }

  if (event.type === "CHOOSE_DECISION" && (state === "warning" || state === "rsvp_choice" || state === "rsvp_change")) {
    return "rsvp_name";
  }

  if (event.type === "SUBMIT_NAME" && state === "rsvp_name") {
    if (event.response === "no") {
      return "outcome_no";
    }
    return "rsvp_count";
  }

  if (event.type === "SELECT_COUNT" && state === "rsvp_count") {
    if (event.count === "more") {
      return "rsvp_count_custom";
    }
    return `outcome_${event.response}` as Extract<ExperienceState, `outcome_${RsvpResponse}`>;
  }

  if (event.type === "SUBMIT_CUSTOM_COUNT" && state === "rsvp_count_custom") {
    return `outcome_${event.response}` as Extract<ExperienceState, `outcome_${RsvpResponse}`>;
  }

  // Direct choice fallback (e.g. tests or direct jump)
  if (event.type === "CHOOSE_RSVP") {
    if (state === "warning" || state === "rsvp_choice" || state === "rsvp_change" || state === "rsvp_count" || state === "rsvp_name" || state === "rsvp_count_custom") {
      return `outcome_${event.response}` as Extract<ExperienceState, `outcome_${RsvpResponse}`>;
    }
  }

  return state;
}

export function isAutomaticState(state: ExperienceState): boolean {
  return state in automaticTransitions;
}

export function isProgressState(state: ExperienceState): boolean {
  return state === "system_scan" || state === "installation";
}

