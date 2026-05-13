/**
 * Forum header component displaying banner and forum info
 */

import { motion } from 'motion/react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { ForumHeaderProps } from './types';
import { tweens, loop, springs } from '@/lib/animation-presets';
import { FADE_IN, FADE_UP } from '@/lib/animations/transitions';

/**
 */
/**
 * Forum Header component.
 */
export function ForumHeader({ forum, userId, onSubscribe, onNavigateToAdmin }: ForumHeaderProps) {
  const isAdminOrMod = forum.ownerId === userId || forum.moderators?.some((m) => m.id === userId);

  return (
    <div className="relative">
      {/* Banner with Gradient Overlay */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-r from-primary-600 to-primary-800">
        {forum.bannerUrl && (
          <img src={forum.bannerUrl} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-900/80" />
      </div>

      {/* Forum Info - Glassmorphic */}
      <div className="border-b border-primary-500/20 bg-[var(--token-card-bg)]/[0.50] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 py-4">
          <motion.div
            className="flex items-start gap-4"
            {...FADE_UP}
            transition={springs.bouncy}
          >
            <motion.div
              className="relative -mt-10 h-20 w-20 overflow-hidden rounded-full border-4 border-dark-800 bg-gradient-to-br from-primary-500/20 to-purple-500/20"
              whileHover={{ opacity: 0.9 }}
              transition={springs.snappy}
            >
              {/* Gradient border pulse */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-purple-600 opacity-50"
                animate={{
                  boxShadow: ['0 0 0 0 color-mix(in srgb, var(--color-brand-purple) 60%, transparent)', '0 0 0 6px color-mix(in srgb, var(--color-brand-purple) 0%, transparent)'],
                }}
                transition={loop(tweens.ambientSlow)}
              />
              {forum.iconUrl ? (
                <img
                  src={forum.iconUrl}
                  alt={forum.name}
                  className="relative z-10 h-full w-full object-cover"
                />
              ) : (
                <div className="relative z-10 flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-400 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
                  {forum.name.charAt(0)}
                </div>
              )}
            </motion.div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="bg-gradient-to-r from-white via-primary-100 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
                    {forum.name}
                  </h1>
                  <p className="text-gray-400">c/{forum.slug}</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Admin Button - Only for owners/moderators */}
                  {isAdminOrMod && (
                    <motion.button
                      onClick={() => {
                        HapticFeedback.light();
                        onNavigateToAdmin();
                      }}
                      whileHover={{ opacity: 0.9 }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-full bg-[var(--token-card-bg)] p-2 text-gray-400 backdrop-blur-sm transition-colors hover:bg-[var(--token-card-bg)] hover:text-white"
                      title="Forum Settings"
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                    </motion.button>
                  )}

                  <motion.button
                    onClick={() => {
                      HapticFeedback.light();
                      onSubscribe();
                    }}
                    whileHover={{ opacity: 0.9 }}
                    whileTap={{ scale: 0.95 }}
                    className={`rounded-xl px-6 py-2.5 font-bold transition-all duration-300 ${
                      forum.isSubscribed
                        ? 'border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] text-white/90 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-[var(--token-card-bg)]'
                        : 'border border-primary-500/20 bg-primary-500/10 text-primary-300 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-primary-500/16'
                    }`}
                  >
                    {forum.isSubscribed ? 'Joined' : 'Join Community'}
                  </motion.button>
                </div>
              </div>

              {forum.description && (
                <motion.p
                  {...FADE_IN}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-gray-300"
                >
                  {forum.description}
                </motion.p>
              )}

              <p className="mt-2 text-sm text-gray-500">
                {(forum.memberCount ?? 0).toLocaleString()} members
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
