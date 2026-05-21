import { useEffect, useRef, useState } from 'react';
import type { AnimationItem } from 'lottie-web';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { loadLottieSvgPlayer } from './lottie-player';

interface LottieAssetRendererProps {
  readonly path: string;
  readonly fallbackPath?: string;
  readonly label: string;
  readonly loop?: boolean;
  readonly autoplay?: boolean;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly fallback?: React.ReactNode;
}

function useIsVisible(ref: React.RefObject<HTMLElement | null>): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { rootMargin: '160px', threshold: 0.05 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return visible;
}

/**
 * Normalizes catalog-provided Lottie paths into public asset URLs.
 */
export function resolveLottieAssetPath(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  return `/lottie/${path}`;
}

/**
 * Lazy-loads a Lottie animation with visibility gating and a safe fallback path.
 */
export function LottieAssetRenderer({
  path,
  fallbackPath,
  label,
  loop = true,
  autoplay = true,
  className,
  style,
  fallback,
}: LottieAssetRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const isVisible = useIsVisible(containerRef);
  const resolvedPath = resolveLottieAssetPath(path);
  const resolvedFallbackPath = fallbackPath ? resolveLottieAssetPath(fallbackPath) : null;
  const [activePath, setActivePath] = useState(resolvedPath);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setActivePath(resolvedPath);
    setFailed(false);
  }, [resolvedPath]);

  useEffect(() => {
    if (prefersReducedMotion || failed || !isVisible || !containerRef.current) return;

    let canceled = false;
    const container = containerRef.current;

    async function loadAnimation() {
      try {
        const lottie = await loadLottieSvgPlayer();
        if (canceled) return;

        const animation = lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop,
          autoplay,
          path: activePath,
        });

        animation.addEventListener('data_failed', () => {
          if (canceled) return;
          if (resolvedFallbackPath && activePath !== resolvedFallbackPath) {
            animation.destroy();
            animationRef.current = null;
            setActivePath(resolvedFallbackPath);
            return;
          }
          setFailed(true);
        });
        animationRef.current = animation;
      } catch {
        if (canceled) return;
        if (resolvedFallbackPath && activePath !== resolvedFallbackPath) {
          setActivePath(resolvedFallbackPath);
          return;
        }
        setFailed(true);
      }
    }

    void loadAnimation();

    return () => {
      canceled = true;
      animationRef.current?.destroy();
      animationRef.current = null;
    };
  }, [activePath, autoplay, failed, isVisible, loop, prefersReducedMotion, resolvedFallbackPath]);

  if (prefersReducedMotion || failed) {
    return <>{fallback ?? null}</>;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      role="img"
      aria-label={label}
    >
      {!isVisible && fallback}
    </div>
  );
}
