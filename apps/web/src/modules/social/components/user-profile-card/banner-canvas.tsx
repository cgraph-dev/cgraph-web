import { memo, useEffect, useRef } from 'react';

import type { BannerProps } from './types';

/** Network node for animated banner */
interface BannerNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Aurora blob config */
interface AuroraBlob {
  cx: number;
  cy: number;
  r: number;
  color: string;
  alpha: number;
}

const CONNECTION_DISTANCE = 100;
const NODE_COUNT = 5;
const TIME_INCREMENT = 0.004;

function initNodes(w: number, h: number): BannerNode[] {
  return Array.from({ length: NODE_COUNT }, (_, i) => ({
    x: w * (0.1 + i * 0.2) + (Math.random() - 0.5) * 20,
    y: h * (0.2 + Math.random() * 0.6),
    vx: (Math.random() - 0.5) * 0.12,
    vy: (Math.random() - 0.5) * 0.09,
  }));
}

function drawAnimatedBanner(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  nodes: BannerNode[]
): void {
  ctx.clearRect(0, 0, w, h);

  // Deep base gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#020407');
  bg.addColorStop(0.6, '#050810');
  bg.addColorStop(1, '#040608');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Slow aurora blobs
  const blobs: AuroraBlob[] = [
    {
      cx: w * (0.2 + 0.07 * Math.sin(t * 0.6)),
      cy: h * 0.4,
      r: w * 0.3,
      color: 'rgba(0,212,170,',
      alpha: 0.07,
    },
    {
      cx: w * (0.8 + 0.05 * Math.cos(t * 0.4)),
      cy: h * 0.5,
      r: w * 0.35,
      color: 'rgba(124,110,245,',
      alpha: 0.055,
    },
    {
      cx: w * (0.5 + 0.09 * Math.sin(t * 0.35)),
      cy: h * 0.3,
      r: w * 0.22,
      color: 'rgba(0,150,255,',
      alpha: 0.04,
    },
  ];

  for (const blob of blobs) {
    const g = ctx.createRadialGradient(blob.cx, blob.cy, 0, blob.cx, blob.cy, blob.r);
    g.addColorStop(0, blob.color + blob.alpha + ')');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // Update + draw nodes
  for (const p of nodes) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;

    const rx = Math.round(p.x);
    const ry = Math.round(p.y);

    // Radial glow
    const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, 20);
    g.addColorStop(0, 'rgba(0,212,170,0.07)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Center dot
    ctx.beginPath();
    ctx.arc(rx, ry, 1.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,212,170,0.45)';
    ctx.fill();
  }

  // Connection lines between nearby nodes
  ctx.lineWidth = 0.5;
  for (let i = 0; i < nodes.length; i++) {
    const ni = nodes[i]!;
    for (let j = i + 1; j < nodes.length; j++) {
      const nj = nodes[j]!;
      const d = Math.hypot(ni.x - nj.x, ni.y - nj.y);
      if (d < CONNECTION_DISTANCE) {
        ctx.strokeStyle = `rgba(0,212,170,${0.035 * (1 - d / CONNECTION_DISTANCE)})`;
        ctx.beginPath();
        ctx.moveTo(Math.round(ni.x), Math.round(ni.y));
        ctx.lineTo(Math.round(nj.x), Math.round(nj.y));
        ctx.stroke();
      }
    }
  }
  ctx.stroke();

  // Bottom dissolve
  const vg = ctx.createLinearGradient(0, h * 0.35, 0, h);
  vg.addColorStop(0, 'transparent');
  vg.addColorStop(1, 'rgba(8,9,15,0.96)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

function drawStaticBanner(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#030407';
  ctx.fillRect(0, 0, w, h);

  // Center radial glow
  const g = ctx.createRadialGradient(w / 2, h * 0.5, 0, w / 2, h * 0.5, w * 0.42);
  g.addColorStop(0, 'rgba(25,35,60,0.3)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Bottom dissolve
  const vg = ctx.createLinearGradient(0, h * 0.28, 0, h);
  vg.addColorStop(0, 'transparent');
  vg.addColorStop(1, 'rgba(8,9,15,0.92)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

export const BannerCanvas = memo(function BannerCanvas({
  bannerType,
  accentColor: _accentColor,
  prefersReducedMotion,
}: BannerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const nodesRef = useRef<BannerNode[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 360;
    const cssH = canvas.clientHeight || 116;

    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    const w = cssW;
    const h = cssH;

    // Static fallback when reduced motion or static type
    if (bannerType !== 'animated' || prefersReducedMotion) {
      drawStaticBanner(ctx, w, h);
      return;
    }

    // Animated banner
    nodesRef.current = initNodes(w, h);
    timeRef.current = 0;
    let running = true;

    function loop(): void {
      if (!running) return;
      drawAnimatedBanner(ctx!, w, h, timeRef.current, nodesRef.current);
      timeRef.current += TIME_INCREMENT;
      animFrameRef.current = requestAnimationFrame(loop);
    }

    // Page Visibility API — pause rAF when hidden
    function onVisibilityChange(): void {
      if (document.hidden) {
        cancelAnimationFrame(animFrameRef.current);
      } else if (running) {
        loop();
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    loop();

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [bannerType, prefersReducedMotion]);

  return (
    <div className="relative h-[116px] overflow-hidden rounded-t-[21px] bg-[#030408]">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-16 bg-gradient-to-b from-transparent to-[#08090f]" />
    </div>
  );
});
