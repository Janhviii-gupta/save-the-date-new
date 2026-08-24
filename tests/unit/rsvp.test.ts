import { describe, expect, it } from "vitest";
import { rsvpSubmissionSchema } from "@/lib/validation/rsvp";

describe("RSVP validation", () => {
  it("accepts valid YES and MAYBE submissions with name and positive attendance count", () => {
    expect(
      rsvpSubmissionSchema.safeParse({
        response: "yes",
        submittedName: "Rahul Sharma",
        attendanceCount: 2,
        idempotencyKey: crypto.randomUUID()
      }).success
    ).toBe(true);

    expect(
      rsvpSubmissionSchema.safeParse({
        response: "maybe",
        submittedName: "Priya",
        attendanceCount: 1,
        idempotencyKey: crypto.randomUUID()
      }).success
    ).toBe(true);
  });

  it("accepts typo-friendly names verbatim (e.g., abbreviations, partial spellings, non-latin characters)", () => {
    for (const name of ["Rahul Sharm", "R Sharma", "Rahul", "राहुल शर्मा", "Guest 123", "A"]) {
      const res = rsvpSubmissionSchema.safeParse({
        response: "yes",
        submittedName: name,
        attendanceCount: 3,
        idempotencyKey: crypto.randomUUID()
      });
      expect(res.success).toBe(true);
    }
  });

  it("accepts NO with null attendance count", () => {
    expect(
      rsvpSubmissionSchema.safeParse({
        response: "no",
        submittedName: "Neha Sharma",
        attendanceCount: null,
        idempotencyKey: crypto.randomUUID()
      }).success
    ).toBe(true);
  });

  it("rejects NO when attendance count is provided", () => {
    expect(
      rsvpSubmissionSchema.safeParse({
        response: "no",
        submittedName: "Neha Sharma",
        attendanceCount: 1,
        idempotencyKey: crypto.randomUUID()
      }).success
    ).toBe(false);
  });

  it("rejects YES/MAYBE when attendance count is missing, null, or zero", () => {
    expect(
      rsvpSubmissionSchema.safeParse({
        response: "yes",
        submittedName: "Rahul",
        attendanceCount: null,
        idempotencyKey: crypto.randomUUID()
      }).success
    ).toBe(false);

    expect(
      rsvpSubmissionSchema.safeParse({
        response: "yes",
        submittedName: "Rahul",
        attendanceCount: 0,
        idempotencyKey: crypto.randomUUID()
      }).success
    ).toBe(false);
  });

  it("rejects empty or whitespace-only submitted names", () => {
    expect(
      rsvpSubmissionSchema.safeParse({
        response: "yes",
        submittedName: "   ",
        attendanceCount: 2,
        idempotencyKey: crypto.randomUUID()
      }).success
    ).toBe(false);
  });

  it("rejects malformed idempotency keys", () => {
    expect(
      rsvpSubmissionSchema.safeParse({
        response: "yes",
        submittedName: "Rahul",
        attendanceCount: 1,
        idempotencyKey: "not-a-uuid"
      }).success
    ).toBe(false);
  });
});

