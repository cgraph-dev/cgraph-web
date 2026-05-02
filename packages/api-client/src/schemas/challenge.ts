/**
 * Challenge-related Zod schemas and types.
 *
 * Used by rate limit challenge resolution and client version check flows.
 */
import { z } from 'zod';

/** Schema for challenge options returned by GET /challenge/options. */
export const challengeOptionsSchema = z.object({
  token: z.string(),
  options: z.array(z.enum(['push', 'captcha'])),
});

/** Challenge options: session token + available challenge types. */
export type ChallengeOptions = z.infer<typeof challengeOptionsSchema>;

/** Schema for version info returned by GET /app/version. */
export const versionInfoSchema = z.object({
  min_version: z.string(),
  latest_version: z.string(),
  force_update: z.boolean(),
  update_url: z.string().nullable(),
  pending_deprecation: z.string().nullable(),
});

/** Version info for a specific platform. */
export type VersionInfo = z.infer<typeof versionInfoSchema>;
