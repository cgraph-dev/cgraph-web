/**
 * Type stubs for mapbox-gl and react-map-gl.
 *
 * These are optional peer dependencies loaded lazily in the live
 * location map component. The stubs prevent TypeScript errors when
 * the packages are not installed.
 */

declare module 'mapbox-gl' {
  export const version: string;
  const mapboxgl: unknown;
  export default mapboxgl;
}

declare module 'react-map-gl' {
  import type { ReactNode } from 'react';

  interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
  }

  interface MapProps {
    initialViewState?: ViewState;
    style?: Record<string, string | number>;
    mapStyle?: string;
    mapboxAccessToken?: string;
    children?: ReactNode;
  }

  interface MarkerProps {
    longitude: number;
    latitude: number;
    anchor?: string;
    children?: ReactNode;
  }

  export function Map(props: MapProps): ReactNode;
  export function Marker(props: MarkerProps): ReactNode;
}
