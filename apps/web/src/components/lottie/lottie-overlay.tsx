/**
 * LottieOverlay Component — ARCHIVED.
 *
 * Profile effects have been removed (Phase 7 cosmetics consolidation).
 * This component is kept as a no-op stub for import compatibility.
 *
 */

export interface LottieOverlayProps {
  /** Profile effect ID (archived — always renders nothing). */
  effectId?: string | null | undefined;
  opacity?: number;
  blendMode?: React.CSSProperties['mixBlendMode'];
  speed?: number;
  className?: string;
}

/**
 * No-op stub. Profile effects have been archived.
 */
export function LottieOverlay(_props: LottieOverlayProps): null {
  return null;
}

export default LottieOverlay;
