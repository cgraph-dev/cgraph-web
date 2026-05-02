/**
 * Shared TypeScript types for notification profiles.
 *
 * Mirrors Signal's NotificationProfile data model adapted for CGraph's
 * backend (Elixir/Phoenix) API response shape.
 */

/** ISO 8601 day-of-week numbering (1=Monday .. 7=Sunday). */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Human-readable day labels indexed by DayOfWeek. */
export const DAY_LABELS: Record<DayOfWeek, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
} as const;

/** Short single-letter day labels for compact display. */
export const DAY_LETTERS: Record<DayOfWeek, string> = {
  1: 'M',
  2: 'T',
  3: 'W',
  4: 'T',
  5: 'F',
  6: 'S',
  7: 'S',
} as const;

/** All seven days for iteration. */
export const ALL_DAYS: readonly DayOfWeek[] = [1, 2, 3, 4, 5, 6, 7] as const;

/** Default weekdays (Mon-Fri). */
export const WEEKDAYS: readonly DayOfWeek[] = [1, 2, 3, 4, 5] as const;

/** Schedule attached to a notification profile. */
export interface NotificationProfileSchedule {
  readonly id: string;
  readonly enabled: boolean;
  readonly start_time: number; // HHMM format (e.g. 900 = 9:00am)
  readonly end_time: number; // HHMM format (e.g. 1700 = 5:00pm)
  readonly days_enabled: readonly DayOfWeek[];
}

/** Allowed member entry (user who bypasses DND). */
export interface NotificationProfileAllowedMember {
  readonly id: string;
  readonly username: string | null;
  readonly avatar_url: string | null;
}

/** Full notification profile as returned by the API. */
export interface NotificationProfile {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly color: string;
  readonly allow_all_calls: boolean;
  readonly allow_all_mentions: boolean;
  readonly schedule: NotificationProfileSchedule | null;
  readonly allowed_members: readonly NotificationProfileAllowedMember[];
  readonly inserted_at: string;
  readonly updated_at: string;
  readonly active_until?: string | null;
}

/** Request to create a profile. */
export interface CreateNotificationProfileRequest {
  readonly name: string;
  readonly emoji?: string;
  readonly color?: string;
}

/** Request to update a profile. */
export interface UpdateNotificationProfileRequest {
  readonly name?: string;
  readonly emoji?: string;
  readonly color?: string;
  readonly allow_all_calls?: boolean;
  readonly allow_all_mentions?: boolean;
}

/** Request to update a schedule. */
export interface UpdateNotificationProfileScheduleRequest {
  readonly enabled?: boolean;
  readonly start_time?: number;
  readonly end_time?: number;
  readonly days_enabled?: readonly DayOfWeek[];
}

/** Request to set allowed members. */
export interface SetAllowedMembersRequest {
  readonly user_ids: readonly string[];
}

/** Request to manually activate a profile. */
export interface ActivateProfileRequest {
  readonly profile_id: string;
  readonly duration_minutes?: number | null;
}

/** Quick-enable duration options (Signal's duration picker). */
export const QUICK_ENABLE_DURATIONS = [
  { label: '1 hour', minutes: 60 },
  { label: '8 hours', minutes: 480 },
  { label: 'Until tomorrow', minutes: null }, // computed client-side
  { label: 'Indefinitely', minutes: null },
] as const;

/** Maximum profiles by subscription tier. */
export const MAX_PROFILES = {
  free: 5,
  premium: 10,
  enterprise: 10,
} as const;

/**
 * Converts HHMM integer to a display string.
 * e.g. 900 -> "9:00 AM", 1700 -> "5:00 PM", 0 -> "12:00 AM"
 */
export function hhmmToDisplayString(hhmm: number, use24h: boolean = false): string {
  const hours = Math.floor(hhmm / 100);
  const minutes = hhmm % 100;

  if (use24h) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Converts an HTML time input value ("HH:MM") to HHMM integer.
 * e.g. "09:00" -> 900, "17:30" -> 1730
 */
export function timeInputToHhmm(timeStr: string): number {
  const [hours, mins] = timeStr.split(':').map(Number);
  return (hours ?? 0) * 100 + (mins ?? 0);
}

/**
 * Converts HHMM integer to an HTML time input value ("HH:MM").
 * e.g. 900 -> "09:00", 1700 -> "17:00"
 */
export function hhmmToTimeInput(hhmm: number): string {
  const hours = Math.floor(hhmm / 100);
  const minutes = hhmm % 100;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
