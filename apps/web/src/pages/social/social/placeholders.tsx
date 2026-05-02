/**
 * Placeholder Components for Social Hub
 *
 * Elite, holographic landing states that match the Messages page aesthetic.
 */

import { motion } from 'motion/react';
import {
  UsersIcon,
  SparklesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { tweens, loop, springs } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';
import { durations } from '@cgraph/animation-constants';

/**
 * Main Social Hub Landing State
 */
export function SocialHubPlaceholder() {
  return (
    <motion.div
      className="relative flex h-full flex-1 items-center justify-center overflow-hidden"
      {...FADE_IN}
      transition={tweens.smooth}
    >
      {/* Ambient particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.1,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: durations.epic.ms / 1000 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      <motion.div
        className="relative z-10 text-center"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={springs.dramatic}
      >
        <div className="relative mb-8 inline-block">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-pink-500/20 shadow-2xl backdrop-blur-md">
            <UsersIcon className="h-12 w-12 text-primary-400" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-400/20 to-purple-400/20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
              rotate: [0, 180, 360],
            }}
            transition={loop(tweens.glacial)}
          />
          <motion.div
            className="absolute -inset-4 rounded-3xl border border-primary-400/20"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{ ...loop(tweens.decorative), delay: 0.5 }}
          />
        </div>

        <h3 className="mb-3 flex items-center justify-center gap-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
          Your Social Hub
          <SparklesIcon className="h-6 w-6 animate-pulse text-primary-400" />
        </h3>
        <p className="mx-auto max-w-sm text-lg font-medium text-white/40 leading-relaxed">
          Find a friend or discover new groups to begin interacting.
        </p>

        <motion.div
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/5 bg-[var(--token-bg-primary)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 shadow-inner shadow-black/40"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={loop(tweens.ambient)}
        >
          <ShieldCheckIcon className="h-4 w-4 text-primary-500" />
          Protocol Encryption Active
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
