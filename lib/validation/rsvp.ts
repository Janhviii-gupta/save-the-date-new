import { z } from "zod";

export const rsvpResponseSchema = z.enum(["yes", "maybe", "no"]);

export const rsvpSubmissionSchema = z
  .object({
    response: rsvpResponseSchema,
    submittedName: z.string().trim().min(1, "Name is required").max(120),
    attendanceCount: z.number().int().min(1).nullable(),
    idempotencyKey: z.string().uuid()
  })
  .refine(
    (data) => {
      if (data.response === "no") {
        return data.attendanceCount === null;
      }
      return typeof data.attendanceCount === "number" && data.attendanceCount >= 1;
    },
    {
      message: "Attendance count must be at least 1 for YES/MAYBE, and null for NO",
      path: ["attendanceCount"]
    }
  );

export type RsvpResponse = z.infer<typeof rsvpResponseSchema>;
export type RsvpSubmission = z.infer<typeof rsvpSubmissionSchema>;

export interface BootstrapPayload {
  currentRsvp?: RsvpResponse;
  submittedName?: string;
  attendanceCount?: number | null;
  guestId?: string;
}

