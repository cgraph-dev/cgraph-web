/**
 * Vanish Timer Presets — Signal's exact DEFAULT_DURATIONS_IN_SECONDS.
 *
 * These are the 8 preset durations for vanish (disappearing) messages,
 * matching Signal's implementation in expirationTimer.std.ts.
 */

/** Signal's exact 8 preset durations for disappearing messages (seconds). */
export const VANISH_TIMER_PRESETS = [
  { value: 0, label: 'Off', shortLabel: 'Off' },
  { value: 30, label: '30 seconds', shortLabel: '30s' },
  { value: 300, label: '5 minutes', shortLabel: '5m' },
  { value: 3600, label: '1 hour', shortLabel: '1h' },
  { value: 28800, label: '8 hours', shortLabel: '8h' },
  { value: 86400, label: '1 day', shortLabel: '1d' },
  { value: 604800, label: '1 week', shortLabel: '1w' },
  { value: 2419200, label: '4 weeks', shortLabel: '4w' },
] as const;

/** Valid vanish timer duration in seconds (0 = off). */
export type VanishTimerDuration = (typeof VANISH_TIMER_PRESETS)[number]['value'];

/** Array of valid vanish timer values for quick lookup. */
export const VANISH_TIMER_VALUES: readonly number[] = VANISH_TIMER_PRESETS.map((p) => p.value);

/** Preset entry shape from the VANISH_TIMER_PRESETS array. */
export type VanishTimerPreset = (typeof VANISH_TIMER_PRESETS)[number];

/**
 * Look up the display label for a vanish timer duration.
 * Returns 'Off' for 0 or unknown values.
 */
export function getVanishTimerLabel(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds === 0) return 'Off';
  for (const preset of VANISH_TIMER_PRESETS) {
    if (preset.value === seconds) return preset.label;
  }
  return 'Off';
}

/**
 * Look up the short label for a vanish timer duration.
 * Returns 'Off' for 0 or unknown values.
 */
export function getVanishTimerShortLabel(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds === 0) return 'Off';
  for (const preset of VANISH_TIMER_PRESETS) {
    if (preset.value === seconds) return preset.shortLabel;
  }
  return 'Off';
}
