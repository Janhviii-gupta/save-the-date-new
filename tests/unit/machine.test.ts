import { describe, expect, it } from "vitest";
import { initialExperienceState, transition } from "@/lib/experience/machine";

describe("experience state machine", () => {
  it("progresses sequentially through the full narrative", () => {
    expect(initialExperienceState(null)).toBe("entry");
    expect(transition("entry", { type: "AUTO_ADVANCE" })).toBe("date_19");
    expect(transition("date_19", { type: "AUTO_ADVANCE" })).toBe("date_20");
    expect(transition("date_20", { type: "AUTO_ADVANCE" })).toBe("november");
    expect(transition("november", { type: "AUTO_ADVANCE" })).toBe("year_2026");
    expect(transition("year_2026", { type: "AUTO_ADVANCE" })).toBe("jaipur");
    expect(transition("jaipur", { type: "AUTO_ADVANCE" })).toBe("incident");
    expect(transition("incident", { type: "AUTO_ADVANCE" })).toBe("cooking");
    expect(transition("cooking", { type: "AUTO_ADVANCE" })).toBe("bite");
    expect(transition("bite", { type: "AUTO_ADVANCE" })).toBe("information_request");
    expect(transition("information_request", { type: "CONTINUE" })).toBe("system_scan");
    expect(transition("system_scan", { type: "AUTO_ADVANCE" })).toBe("match_found");
    expect(transition("match_found", { type: "AUTO_ADVANCE" })).toBe("reveal");
    expect(transition("reveal", { type: "CONTINUE" })).toBe("application_detected");
    expect(transition("application_detected", { type: "VIEW_INSTALLATION" })).toBe("compatibility");
    expect(transition("compatibility", { type: "AUTO_ADVANCE" })).toBe("installation");
    expect(transition("installation", { type: "AUTO_ADVANCE" })).toBe("warning");
    expect(transition("warning", { type: "AUTO_ADVANCE" })).toBe("rsvp_choice");
  });

  it("handles YES multi-step flow with count cards", () => {
    expect(transition("rsvp_choice", { type: "CHOOSE_DECISION", response: "yes" })).toBe("rsvp_name");
    expect(transition("rsvp_name", { type: "SUBMIT_NAME", name: "Rahul Sharma", response: "yes" })).toBe("rsvp_count");
    expect(transition("rsvp_count", { type: "SELECT_COUNT", count: 2, response: "yes" })).toBe("outcome_yes");
  });

  it("handles MAYBE flow with MORE THAN 5 and custom number selector", () => {
    expect(transition("rsvp_choice", { type: "CHOOSE_DECISION", response: "maybe" })).toBe("rsvp_name");
    expect(transition("rsvp_name", { type: "SUBMIT_NAME", name: "Priya Sharma", response: "maybe" })).toBe("rsvp_count");
    expect(transition("rsvp_count", { type: "SELECT_COUNT", count: "more", response: "maybe" })).toBe("rsvp_count_custom");
    expect(transition("rsvp_count_custom", { type: "SUBMIT_CUSTOM_COUNT", count: 7, response: "maybe" })).toBe("outcome_maybe");
  });

  it("handles NO flow by skipping attendance count directly to outcome_no", () => {
    expect(transition("rsvp_choice", { type: "CHOOSE_DECISION", response: "no" })).toBe("rsvp_name");
    expect(transition("rsvp_name", { type: "SUBMIT_NAME", name: "Neha Sharma", response: "no" })).toBe("outcome_no");
  });

  it("starts at the dedicated returning state when an RSVP exists and allows editing", () => {
    expect(initialExperienceState("yes")).toBe("returning");
    expect(transition("returning", { type: "CHANGE_RSVP" })).toBe("rsvp_choice");
  });
});

