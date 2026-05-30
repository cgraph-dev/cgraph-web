/**
 * Controls for starting/stopping live location sharing.
 *
 * Shows a duration picker (15min / 1hr / 8hr), optional proximity
 * threshold slider, and a share/stop toggle. Uses the browser
 * Geolocation API to obtain the user's current position.
 */
import { type ReactNode, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import {
  LOCATION_SHARE_DURATIONS,
  DURATION_LABELS,
  MIN_PROXIMITY_THRESHOLD,
  MAX_PROXIMITY_THRESHOLD,
} from '@cgraph-dev/shared-types';
import type { StartLocationShareParams } from '@cgraph-dev/shared-types';

import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LocationShareControlsProps {
  readonly isSharing: boolean;
  readonly onStartSharing: (params: StartLocationShareParams) => void;
  readonly onStopSharing: () => void;
  readonly featureEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Location share controls panel with duration picker and proximity slider.
 *
 * When `featureEnabled` is false, the controls are hidden (static pins
 * still work through other UI paths).
 */
function LocationShareControls(props: LocationShareControlsProps): ReactNode {
  const { isSharing, onStartSharing, onStopSharing, featureEnabled = true } = props;

  const [selectedDuration, setSelectedDuration] = useState<900 | 3600 | 28800>(3600);
  const [proximityEnabled, setProximityEnabled] = useState(false);
  const [proximityThreshold, setProximityThreshold] = useState(500);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const handleStartShare = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsRequesting(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsRequesting(false);

        const params: StartLocationShareParams = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading ?? 0,
          speed: position.coords.speed ?? 0,
          duration: selectedDuration,
          proximity_threshold: proximityEnabled ? proximityThreshold : undefined,
        };

        onStartSharing(params);
      },
      (error) => {
        setIsRequesting(false);
        logger.warn('[LocationShare] Geolocation error', { code: error.code });

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Location permission denied. Enable it in browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location unavailable. Try again later.');
            break;
          case error.TIMEOUT:
            setGeoError('Location request timed out. Try again.');
            break;
          default:
            setGeoError('Unable to get your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    );
  }, [selectedDuration, proximityEnabled, proximityThreshold, onStartSharing]);

  if (!featureEnabled) return null;

  return (
    <div className="bg-surface-secondary flex flex-col gap-3 rounded-lg p-4">
      <AnimatePresence mode="wait">
        {isSharing ? (
          <motion.div
            key="sharing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-2 text-sm text-green-500">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Sharing your location
            </div>
            <button
              type="button"
              onClick={onStopSharing}
              className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/30"
            >
              Stop Sharing
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
          >
            {/* Duration picker */}
            <div className="flex flex-col gap-1.5">
              <span className="text-text-secondary text-xs font-medium">Duration</span>
              <div className="flex gap-2">
                {LOCATION_SHARE_DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDuration(d)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedDuration === d
                        ? 'bg-primary text-white'
                        : 'bg-surface-tertiary text-text-secondary hover:bg-surface-tertiary/80'
                    }`}
                  >
                    {DURATION_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            {/* Proximity threshold */}
            <div className="flex flex-col gap-1.5">
              <label className="text-text-secondary flex items-center gap-2 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={proximityEnabled}
                  onChange={(e) => setProximityEnabled(e.target.checked)}
                  className="rounded"
                />
                Proximity alert
              </label>
              {proximityEnabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={MIN_PROXIMITY_THRESHOLD}
                    max={MAX_PROXIMITY_THRESHOLD}
                    step={100}
                    value={proximityThreshold}
                    onChange={(e) => setProximityThreshold(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-text-secondary w-16 text-right text-xs">
                    {proximityThreshold >= 1000
                      ? `${(proximityThreshold / 1000).toFixed(1)}km`
                      : `${proximityThreshold}m`}
                  </span>
                </div>
              )}
            </div>

            {/* Error message */}
            {geoError && <p className="text-xs text-red-500">{geoError}</p>}

            {/* Share button */}
            <button
              type="button"
              onClick={handleStartShare}
              disabled={isRequesting}
              className="hover:bg-primary/90 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {isRequesting ? 'Getting location...' : 'Share Live Location'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { LocationShareControls };
export type { LocationShareControlsProps };
