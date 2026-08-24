import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional()
});

const serverEnvironmentSchema = publicEnvironmentSchema.extend({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  INVITATION_SESSION_SECRET: z.string().min(16),
  RATE_LIMIT_REDIS_URL: z.string().url().optional(),
  RATE_LIMIT_REDIS_TOKEN: z.string().min(1).optional()
});

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function getPublicEnvironment(): PublicEnvironment {
  return publicEnvironmentSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  });
}

export function getServerEnvironment(): ServerEnvironment {
  return serverEnvironmentSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    INVITATION_SESSION_SECRET: process.env.INVITATION_SESSION_SECRET,
    RATE_LIMIT_REDIS_URL: process.env.RATE_LIMIT_REDIS_URL,
    RATE_LIMIT_REDIS_TOKEN: process.env.RATE_LIMIT_REDIS_TOKEN
  });
}

