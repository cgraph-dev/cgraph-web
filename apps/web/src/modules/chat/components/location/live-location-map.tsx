/**
 * Live location map showing all active location sharers in a conversation.
 *
 * Uses Mapbox GL JS via react-map-gl, loaded lazily via dynamic import
 * to avoid adding ~200KB to the main bundle. Renders avatar markers
 * for each active sharer with smooth position transitions.
 *
 * Requires VITE_MAPBOX_ACCESS_TOKEN environment variable.
 * Requires react-map-gl and mapbox-gl as optional peer dependencies.
 */
import { type ReactNode, Suspense, lazy, useMemo } from 'react';

import { LiveLocationMarker } from './live-location-marker';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SharerInfo {
  readonly userId: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy: number;
  readonly heading: number;
  readonly speed: number;
}

interface LiveLocationMapProps {
  /** Active sharers to display on the map. */
  readonly sharers: readonly SharerInfo[];
  /** Current authenticated user's ID. */
  readonly currentUserId: string;
  /** Whether to use dark map style. */
  readonly darkMode?: boolean;
  /** Map container height in pixels. */
  readonly height?: number;
}

interface ViewState {
  readonly longitude: number;
  readonly latitude: number;
  readonly zoom: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Calculate map center and zoom from active sharers. */
function calculateViewState(sharers: readonly SharerInfo[]): ViewState {
  if (sharers.length === 0) {
    return { longitude: 0, latitude: 0, zoom: 2 };
  }

  if (sharers.length === 1) {
    const first = sharers[0];
    if (first) {
      return {
        longitude: first.longitude,
        latitude: first.latitude,
        zoom: 15,
      };
    }
  }

  const avgLat = sharers.reduce((sum, s) => sum + s.latitude, 0) / sharers.length;
  const avgLng = sharers.reduce((sum, s) => sum + s.longitude, 0) / sharers.length;

  const latSpread =
    Math.max(...sharers.map((s) => s.latitude)) - Math.min(...sharers.map((s) => s.latitude));
  const lngSpread =
    Math.max(...sharers.map((s) => s.longitude)) - Math.min(...sharers.map((s) => s.longitude));
  const spread = Math.max(latSpread, lngSpread);

  let zoom = 15;
  if (spread > 1) zoom = 8;
  else if (spread > 0.1) zoom = 11;
  else if (spread > 0.01) zoom = 13;

  return { longitude: avgLng, latitude: avgLat, zoom };
}

// ---------------------------------------------------------------------------
// Lazy inner component
// ---------------------------------------------------------------------------

/**
 * Dynamically loaded Mapbox map. This component is never imported
 * statically — it's loaded via React.lazy so that mapbox-gl + react-map-gl
 * are not included in the main bundle.
 */
const MapboxInner = lazy(async () => {
  // Dynamic imports: these packages are optional peer deps
  // eslint: the dynamic import() is intentional for code splitting
  const reactMapGl = await import(/* webpackChunkName: "react-map-gl" */ 'react-map-gl');
  const mapboxGl = await import(/* webpackChunkName: "mapbox-gl" */ 'mapbox-gl');

  const MapGL = reactMapGl.Map ?? reactMapGl.default?.Map;
  const MarkerComponent = reactMapGl.Marker ?? reactMapGl.default?.Marker;

  function MapboxMap(mapProps: LiveLocationMapProps): ReactNode {
    const { sharers, currentUserId, darkMode = true, height = 400 } = mapProps;

    const rawToken: unknown = import.meta.env['VITE_MAPBOX_ACCESS_TOKEN'];
    const accessToken = typeof rawToken === 'string' ? rawToken : '';
    const mapStyle = darkMode
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';

    const viewState = useMemo(() => calculateViewState(sharers), [sharers]);

    if (!accessToken) {
      return (
        <div
          className="bg-surface-secondary text-text-secondary flex items-center justify-center rounded-lg text-sm"
          style={{ height }}
        >
          Mapbox access token not configured
        </div>
      );
    }

    // Inject mapbox-gl CSS if not already present
    if (typeof document !== 'undefined' && !document.querySelector('link[href*="mapbox-gl"]')) {
      const versionCandidate: unknown = mapboxGl.version;
      const version = typeof versionCandidate === 'string' ? versionCandidate : '3';
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://api.mapbox.com/mapbox-gl-js/v${String(version)}/mapbox-gl.css`;
      document.head.appendChild(link);
    }

    if (!MapGL || !MarkerComponent) {
      return (
        <div
          className="bg-surface-secondary text-text-secondary flex items-center justify-center rounded-lg text-sm"
          style={{ height }}
        >
          Map library not available
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-lg" style={{ height }}>
        <MapGL
          initialViewState={viewState}
          style={{ width: '100%', height: '100%' }}
          mapStyle={mapStyle}
          mapboxAccessToken={accessToken}
        >
          {sharers.map((sharer) => (
            <MarkerComponent
              key={sharer.userId}
              longitude={sharer.longitude}
              latitude={sharer.latitude}
              anchor="center"
            >
              <LiveLocationMarker
                userId={sharer.userId}
                displayName={sharer.displayName}
                avatarUrl={sharer.avatarUrl}
                heading={sharer.heading}
                accuracy={sharer.accuracy}
                isCurrentUser={sharer.userId === currentUserId}
              />
            </MarkerComponent>
          ))}
        </MapGL>
      </div>
    );
  }

  return { default: MapboxMap };
});

// ---------------------------------------------------------------------------
// Exported wrapper
// ---------------------------------------------------------------------------

/**
 * Lazy-loaded live location map.
 *
 * Shows a loading skeleton while Mapbox GL JS is being fetched.
 * If there are no active sharers, renders nothing.
 */
function LiveLocationMap(props: LiveLocationMapProps): ReactNode {
  const { sharers, height = 400 } = props;

  if (sharers.length === 0) return null;

  return (
    <Suspense
      fallback={
        <div
          className="bg-surface-secondary flex animate-pulse items-center justify-center rounded-lg"
          style={{ height }}
        >
          <span className="text-text-secondary text-sm">Loading map...</span>
        </div>
      }
    >
      <MapboxInner {...props} />
    </Suspense>
  );
}

export { LiveLocationMap };
export type { LiveLocationMapProps, SharerInfo };
