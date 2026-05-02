/**
 * Shared types for live location sharing across web and mobile.
 */

/** GPS coordinates broadcast from a live location tracker. */
export interface LiveLocationUpdate {
  readonly user_id: string;
  readonly share_id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy: number;
  readonly heading: number;
  readonly speed: number;
  readonly updated_at: string;
}

/** Configuration for starting a live location share. */
export interface LocationShareConfig {
  readonly duration: 900 | 3600 | 28800;
  readonly proximity_threshold?: number;
}

/** Parameters for starting a location share via REST API. */
export interface StartLocationShareParams extends LocationShareConfig {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy?: number;
  readonly heading?: number;
  readonly speed?: number;
}

/** Proximity alert fired when two sharers come within threshold distance. */
export interface ProximityAlert {
  readonly user_id_1: string;
  readonly user_id_2: string;
  readonly share_id_1: string;
  readonly share_id_2: string;
  readonly distance_m: number;
}

/** Active share info returned from the server. */
export interface ActiveLocationShare {
  readonly id: string;
  readonly user_id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy: number | null;
  readonly heading: number | null;
  readonly speed: number | null;
  readonly duration: number;
  readonly expires_at: string;
  readonly proximity_threshold: number | null;
  readonly updated_at: string;
}

/** Duration options for live location sharing. */
export const LOCATION_SHARE_DURATIONS = [900, 3600, 28800] as const;

/** Human-readable labels for durations. */
export const DURATION_LABELS: Record<number, string> = {
  900: '15 minutes',
  3600: '1 hour',
  28800: '8 hours',
} as const;

/** Proximity threshold range (in meters). */
export const MIN_PROXIMITY_THRESHOLD = 100;
export const MAX_PROXIMITY_THRESHOLD = 10_000;
