type SvgLottiePlayer = (typeof import('lottie-web/build/player/lottie_light'))['default'];
type CanvasLottiePlayer = (typeof import('lottie-web/build/player/lottie_light_canvas'))['default'];

let svgPlayerPromise: Promise<SvgLottiePlayer> | null = null;
let canvasPlayerPromise: Promise<CanvasLottiePlayer> | null = null;

/**
 * Shared Lottie player loader for SVG animations.
 *
 * The light build excludes expression evaluation, which keeps production CSP
 * clean and avoids Vite's eval warning.
 */
export function loadLottieSvgPlayer(): Promise<SvgLottiePlayer> {
  svgPlayerPromise ??= import('lottie-web/build/player/lottie_light').then(
    (module) => module.default
  );
  return svgPlayerPromise;
}

/**
 * Shared Lottie player loader for canvas-heavy avatar borders.
 *
 * The light canvas build avoids the full player's eval path while preserving
 * the renderer we use for dense customization grids.
 */
export function loadLottieCanvasPlayer(): Promise<CanvasLottiePlayer> {
  canvasPlayerPromise ??= import('lottie-web/build/player/lottie_light_canvas').then(
    (module) => module.default
  );
  return canvasPlayerPromise;
}
