/**
 * Authentication pages layout wrapper.
 */
import { ReactNode, memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { LogoIcon } from '@/components/logo';
import {
  CyberGrid,
  MorphingBlob,
  FloatingIcons,
  CursorGlow,
  ScanLines,
  ParticleField,
  AuroraGlow,
  prefersReducedMotion,
} from '@/modules/auth/components/auth-effects';
import { tweens } from '@/lib/animation-presets';

interface AuthLayoutProps {
  children: ReactNode;
}

// Feature card component with entry animation and stable hover states.
const FeatureCard = memo(function FeatureCard({
  title,
  subtitle,
  delay,
}: {
  title: string;
  subtitle: string;
  delay: number;
}) {
  const reduced = prefersReducedMotion();

  return (
    <div className="auth-feature-card from-violet-500/10 hover:from-violet-500/15 group rounded-xl border border-white/10 bg-gradient-to-br to-[color-mix(in_srgb,var(--color-brand-purple)_5%,transparent)] p-4 text-center backdrop-blur-md transition-all duration-300 hover:border-[color-mix(in_srgb,var(--color-brand-purple)_30%,transparent)] hover:bg-gradient-to-br hover:to-[color-mix(in_srgb,var(--color-brand-purple)_10%,transparent)]">
      <motion.div
        initial={reduced ? {} : { y: 20 }}
        animate={{ y: 0 }}
        transition={{ ...tweens.emphatic, delay }}
      >
        <div className="auth-feature-card-title text-2xl font-bold transition-colors group-hover:text-violet-300">
          {title}
        </div>
        <div className="auth-feature-card-subtitle mt-1 text-sm">{subtitle}</div>
      </motion.div>
    </div>
  );
});

/**
 * Resolve a CSS variable to its computed hex value for Canvas API compatibility.
 * Canvas addColorStop() cannot use var() or color-mix() — needs real color strings.
 */
function resolveColor(varName: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return val || fallback;
}

/** Lighten a hex color by mixing with white at a given ratio (0-1). */
function lighten(hex: string, ratio: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * ratio);
  const lg = Math.round(g + (255 - g) * ratio);
  const lb = Math.round(b + (255 - b) * ratio);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

// Cyberpunk animated background layers
const BackgroundLayers = memo(function BackgroundLayers() {
  // Resolve CSS variables to real hex colors for Canvas-based components
  const canvasColors = useMemo(() => {
    const primary = resolveColor('--color-brand-purple', '#7c3aed');
    const primaryDark = resolveColor('--color-brand-purple-dark', '#6d28d9');
    return {
      primary,
      primaryDark,
      light70: lighten(primary, 0.3),
      light50: lighten(primary, 0.5),
      light30: lighten(primary, 0.7),
    };
  }, []);

  return (
    <>
      {/* Base dark gradient background */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-br from-[#030712] via-[#0a0f1a] to-[#111827]" />

      {/* Aurora glow effect — CSS-based, can use var() */}
      <div className="fixed inset-0 z-[2]">
        <AuroraGlow
          colors={[
            'var(--color-brand-purple)',
            'var(--color-brand-purple-dark)',
            'color-mix(in srgb, var(--color-brand-purple) 60%, white)',
            'color-mix(in srgb, var(--color-brand-purple) 40%, white)',
          ]}
          speed={10}
        />
      </div>

      {/* Particle field — Canvas-based, needs resolved hex colors */}
      <div className="fixed inset-0 z-[3]">
        <ParticleField
          particleCount={60}
          colors={[
            canvasColors.primary,
            canvasColors.light70,
            canvasColors.light50,
            canvasColors.light30,
          ]}
          connectionDistance={120}
          speed={0.4}
        />
      </div>

      {/* Cyber grid — Canvas-based, needs resolved hex color */}
      <div className="fixed inset-0 z-[4]">
        <CyberGrid color={canvasColors.primary} cellSize={60} pulseSpeed={5000} />
      </div>

      {/* Morphing blobs — CSS-based, can use var() */}
      <MorphingBlob
        color="var(--color-brand-purple)"
        size={600}
        className="-left-48 -top-48 z-[5] opacity-40"
      />
      <MorphingBlob
        color="var(--color-brand-purple-dark)"
        size={500}
        className="-bottom-48 -right-48 z-[5] opacity-30"
      />
      <MorphingBlob
        color="var(--color-brand-purple-dark)"
        size={350}
        className="left-1/3 top-1/4 z-[5] opacity-20"
      />

      {/* Floating security icons — CSS-based, can use var() */}
      <div className="fixed inset-0 z-[6]">
        <FloatingIcons color="color-mix(in srgb, var(--color-brand-purple) 70%, white)" />
      </div>

      {/* Cursor glow effect — CSS-based, can use var() */}
      <CursorGlow color="var(--color-brand-purple)" size={400} />

      {/* CRT scan lines */}
      <ScanLines opacity={0.02} />
    </>
  );
});

/**
 * Auth Layout — page layout wrapper.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  const reduced = prefersReducedMotion();

  return (
    <div className="auth-shell relative flex min-h-screen overflow-hidden bg-black">
      <BackgroundLayers />

      {/* Left side — Branding with enhanced animations */}
      <div className="auth-layout-brand hidden flex-col justify-between p-12 lg:flex lg:w-1/2">
        {/* Logo section */}
        <motion.div
          className="relative z-10"
          initial={reduced ? {} : { opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={tweens.dramatic}
        >
          <a href="https://www.cgraph.org" className="group inline-block">
            <motion.div
              whileHover={reduced ? {} : { scale: 1.05 }}
              whileTap={reduced ? {} : { scale: 0.97 }}
              className="transition-all duration-300"
            >
              <LogoIcon
                size={160}
                className="drop-shadow-[0_0_40px_color-mix(in_srgb,var(--color-brand-purple)_40%,transparent)] transition-all duration-300 group-hover:drop-shadow-[0_0_60px_color-mix(in_srgb,var(--color-brand-purple)_60%,transparent)]"
              />
            </motion.div>
          </a>
        </motion.div>

        {/* Main content section */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={reduced ? {} : { y: 20 }}
            animate={{ y: 0 }}
            transition={{ ...tweens.emphatic, delay: 0.1 }}
          >
            <h1 className="text-5xl font-bold leading-tight text-white">
              <span className="auth-title-gradient bg-gradient-to-r from-violet-400 via-purple-300 to-primary-400 bg-clip-text text-transparent">
                Connect, Share,
              </span>
              <br />
              <span className="auth-title-secondary text-white">Build Community</span>
            </h1>
          </motion.div>

          <motion.p
            className="auth-copy max-w-md text-xl leading-relaxed text-white/80"
            initial={reduced ? {} : { y: 15 }}
            animate={{ y: 0 }}
            transition={{ ...tweens.smooth, delay: 0.3 }}
          >
            The all-in-one platform for{' '}
            <span className="font-medium text-violet-400">secure messaging</span>,{' '}
            <span className="font-medium text-purple-300">group discussions</span>, and{' '}
            <span className="font-medium text-[var(--color-brand-purple)]">community forums</span>.
          </motion.p>

          {/* Feature cards with staggered entry animation */}
          <motion.div
            className="grid grid-cols-3 gap-4 pt-6"
            initial={reduced ? {} : { y: 30 }}
            animate={{ y: 0 }}
            transition={{ ...tweens.dramatic, delay: 0.6 }}
          >
            <FeatureCard title="E2E" subtitle="Encrypted" delay={0.7} />
            <FeatureCard title="Real-time" subtitle="Messaging" delay={0.8} />
            <FeatureCard title="Groups" subtitle="Connected" delay={0.9} />
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div className="auth-footer-copy relative z-10 text-sm text-white/75">
          © 2026 CGraph. All rights reserved.
        </motion.div>
      </div>

      {/* Right side — Auth form with flowing gradient border card */}
      <main className="auth-layout-form flex flex-1 items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={reduced ? {} : { opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...tweens.dramatic, delay: 0.3 }}
        >
          <div className="auth-card-surface auth-card-border auth-card-glow relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#111827]/90 via-[#0a0f1a]/85 to-[#0d1117]/90 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl transition-all duration-500 hover:border-white/[0.15] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_60px_color-mix(in_srgb,var(--color-brand-purple)_6%,transparent),inset_0_1px_0_rgba(255,255,255,0.06)]">
            {children}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
