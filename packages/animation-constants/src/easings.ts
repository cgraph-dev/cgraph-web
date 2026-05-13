/**
 * Easing curves as cubic-bézier control points.
 *
 * Framework adapters convert these to:
 *   - CSS `cubic-bezier(x1, y1, x2, y2)` strings
 *   - Reanimated `Easing.bezier(x1, y1, x2, y2)`
 *   - Framer Motion `[x1, y1, x2, y2]` tuples
 *
 * Unified from:
 *   apps/web/src/lib/animations.ts (easings)
 *   apps/mobile/src/lib/animations.ts (easings)
 *   apps/mobile/src/lib/animations/AnimationLibrary.ts (EASING_FUNCTIONS)
 */

/** Control points for a cubic bézier: [x1, y1, x2, y2] */
export type CubicBezier = readonly [number, number, number, number];

export const cubicBeziers = {
  /** Standard CSS ease */
  ease: [0.25, 0.1, 0.25, 1.0],
  /** Deceleration — elements entering the screen */
  easeOut: [0.0, 0.0, 0.2, 1.0],
  /** Acceleration — elements leaving the screen */
  easeIn: [0.4, 0.0, 1.0, 1.0],
  /** Symmetric ease — layout shifts */
  easeInOut: [0.4, 0.0, 0.2, 1.0],
  /** Spring-like overshoot feel via bezier */
  spring: [0.175, 0.885, 0.32, 1.275],
  /** Bouncy settle via bezier */
  bounce: [0.68, -0.55, 0.265, 1.55],
  /** Material Design standard curve */
  material: [0.4, 0.0, 0.2, 1.0],
  /** Material Design deceleration */
  materialOut: [0.0, 0.0, 0.2, 1.0],
  /** Material Design acceleration */
  materialIn: [0.4, 0.0, 1.0, 1.0],
  /** Smooth cubic */
  smooth: [0.25, 0.46, 0.45, 0.94],
  /** Quad ease-out */
  quadOut: [0.25, 0.46, 0.45, 0.94],
  /** Expo ease-out */
  expoOut: [0.19, 1.0, 0.22, 1.0],
  /** Circ ease-out */
  circOut: [0.075, 0.82, 0.165, 1.0],
  /** Back ease-out (slight overshoot) */
  backOut: [0.175, 0.885, 0.32, 1.275],
} as const satisfies Record<string, CubicBezier>;

/** Format a cubic-bezier tuple into a CSS cubic-bezier() string. */
function formatBezier([x1, y1, x2, y2]: CubicBezier): string {
  return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
}

/**
 * Pre-formatted CSS cubic-bezier() strings for each curve.
 * Useful for inline styles and Tailwind plugins.
 */
export const easings = {
  ease: formatBezier(cubicBeziers.ease),
  easeOut: formatBezier(cubicBeziers.easeOut),
  easeIn: formatBezier(cubicBeziers.easeIn),
  easeInOut: formatBezier(cubicBeziers.easeInOut),
  spring: formatBezier(cubicBeziers.spring),
  bounce: formatBezier(cubicBeziers.bounce),
  material: formatBezier(cubicBeziers.material),
  materialOut: formatBezier(cubicBeziers.materialOut),
  materialIn: formatBezier(cubicBeziers.materialIn),
  smooth: formatBezier(cubicBeziers.smooth),
  quadOut: formatBezier(cubicBeziers.quadOut),
  expoOut: formatBezier(cubicBeziers.expoOut),
  circOut: formatBezier(cubicBeziers.circOut),
  backOut: formatBezier(cubicBeziers.backOut),
} as const satisfies { readonly [K in keyof typeof cubicBeziers]: string };
