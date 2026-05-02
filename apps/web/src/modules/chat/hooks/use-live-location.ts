/**
 * Hook for managing live location sharing state in a conversation.
 *
 * Subscribes to WebSocket channel events (location:update, location:stop,
 * location:start, location:proximity) and exposes a reactive map of active
 * shares plus controls for starting/stopping sharing.
 *
 * GPS interpolation between 30s server broadcasts uses heading + speed
 * for smooth marker movement on the map.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

import type { Channel } from 'phoenix';
import type {
  LiveLocationUpdate,
  ProximityAlert,
  StartLocationShareParams,
} from '@cgraph/shared-types';

import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LocationState {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy: number;
  readonly heading: number;
  readonly speed: number;
  readonly updatedAt: string;
}

interface UseLiveLocationResult {
  /** Map of userId -> latest location state for all active sharers. */
  readonly activeShares: ReadonlyMap<string, LocationState>;
  /** Whether the current user is sharing their location. */
  readonly isSharing: boolean;
  /** Recent proximity alerts. */
  readonly proximityAlerts: readonly ProximityAlert[];
  /** Start sharing location with given duration and initial coords. */
  readonly startSharing: (params: StartLocationShareParams) => void;
  /** Stop sharing location. */
  readonly stopSharing: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isLocationUpdate(payload: unknown): payload is LiveLocationUpdate {
  return (
    isRecord(payload) &&
    typeof payload['user_id'] === 'string' &&
    typeof payload['latitude'] === 'number' &&
    typeof payload['longitude'] === 'number'
  );
}

function isProximityAlert(payload: unknown): payload is ProximityAlert {
  return (
    isRecord(payload) &&
    typeof payload['user_id_1'] === 'string' &&
    typeof payload['user_id_2'] === 'string' &&
    typeof payload['distance_m'] === 'number'
  );
}

function isLocationStart(payload: unknown): payload is { user_id: string; share_id: string } {
  return isRecord(payload) && typeof payload['user_id'] === 'string';
}

function isLocationStop(payload: unknown): payload is { user_id: string; share_id: string } {
  return isRecord(payload) && typeof payload['user_id'] === 'string';
}

const MAX_PROXIMITY_ALERTS = 20;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manage live location sharing for a conversation channel.
 *
 * Listens for location:update, location:start, location:stop, and
 * location:proximity events on the provided Phoenix channel reference.
 */
export function useLiveLocation(
  channel: Channel | null,
  currentUserId: string
): UseLiveLocationResult {
  const [activeShares, setActiveShares] = useState<Map<string, LocationState>>(new Map());
  const [isSharing, setIsSharing] = useState(false);
  const [proximityAlerts, setProximityAlerts] = useState<ProximityAlert[]>([]);

  const interpolationTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Cleanup interpolation timers on unmount
  useEffect(() => {
    const timersRef = interpolationTimers.current;
    return () => {
      for (const timer of timersRef.values()) {
        clearInterval(timer);
      }
    };
  }, []);

  // Subscribe to channel events
  useEffect(() => {
    if (!channel) return;

    const locationUpdateRef = channel.on('location:update', (payload: unknown) => {
      if (!isLocationUpdate(payload)) return;

      setActiveShares((prev) => {
        const next = new Map(prev);
        next.set(payload.user_id, {
          latitude: payload.latitude,
          longitude: payload.longitude,
          accuracy: payload.accuracy,
          heading: payload.heading,
          speed: payload.speed,
          updatedAt: payload.updated_at,
        });
        return next;
      });

      // Set up interpolation between broadcasts
      setupInterpolation(payload);
    });

    const locationStartRef = channel.on('location:start', (payload: unknown) => {
      if (!isLocationStart(payload)) return;
      logger.info('[LiveLocation] share started', { userId: payload.user_id });
    });

    const locationStopRef = channel.on('location:stop', (payload: unknown) => {
      if (!isLocationStop(payload)) return;

      setActiveShares((prev) => {
        const next = new Map(prev);
        next.delete(payload.user_id);
        return next;
      });

      // Clear interpolation timer
      const timer = interpolationTimers.current.get(payload.user_id);
      if (timer) {
        clearInterval(timer);
        interpolationTimers.current.delete(payload.user_id);
      }

      // If this is the current user stopping
      if (payload.user_id === currentUserId) {
        setIsSharing(false);
      }
    });

    const proximityRef = channel.on('location:proximity', (payload: unknown) => {
      if (!isProximityAlert(payload)) return;

      setProximityAlerts((prev) => {
        const next = [payload, ...prev];
        return next.slice(0, MAX_PROXIMITY_ALERTS);
      });
    });

    return () => {
      channel.off('location:update', locationUpdateRef);
      channel.off('location:start', locationStartRef);
      channel.off('location:stop', locationStopRef);
      channel.off('location:proximity', proximityRef);
    };
  }, [channel, currentUserId]);

  /**
   * Set up linear interpolation between 30s server broadcasts.
   * Uses heading and speed to estimate position between updates.
   */
  function setupInterpolation(update: LiveLocationUpdate): void {
    const existingTimer = interpolationTimers.current.get(update.user_id);
    if (existingTimer) clearInterval(existingTimer);

    // Only interpolate if moving (speed > 0.5 m/s)
    if (update.speed <= 0.5) return;

    const intervalMs = 1000;
    const speedMetersPerSec = update.speed;
    const headingRad = (update.heading * Math.PI) / 180;

    // Meters per degree at this latitude
    const metersPerDegreeLat = 111_320;
    const metersPerDegreeLng = 111_320 * Math.cos((update.latitude * Math.PI) / 180);

    let stepCount = 0;
    const maxSteps = 29; // Interpolate for up to 29 seconds

    const timer = setInterval(() => {
      stepCount += 1;
      if (stepCount >= maxSteps) {
        clearInterval(timer);
        interpolationTimers.current.delete(update.user_id);
        return;
      }

      const distancePerStep = speedMetersPerSec;
      const dLat = (distancePerStep * Math.cos(headingRad)) / metersPerDegreeLat;
      const dLng = (distancePerStep * Math.sin(headingRad)) / metersPerDegreeLng;

      setActiveShares((prev) => {
        const current = prev.get(update.user_id);
        if (!current) return prev;

        const next = new Map(prev);
        next.set(update.user_id, {
          ...current,
          latitude: current.latitude + dLat,
          longitude: current.longitude + dLng,
        });
        return next;
      });
    }, intervalMs);

    interpolationTimers.current.set(update.user_id, timer);
  }

  const startSharing = useCallback(
    (params: StartLocationShareParams) => {
      if (!channel) return;

      channel.push('location:start', {
        latitude: params.latitude,
        longitude: params.longitude,
        accuracy: params.accuracy ?? 0,
        heading: params.heading ?? 0,
        speed: params.speed ?? 0,
        duration: params.duration,
        proximity_threshold: params.proximity_threshold,
      });

      setIsSharing(true);
    },
    [channel]
  );

  const stopSharing = useCallback(() => {
    if (!channel) return;
    channel.push('location:stop', {});
    setIsSharing(false);
  }, [channel]);

  return {
    activeShares,
    isSharing,
    proximityAlerts,
    startSharing,
    stopSharing,
  };
}
