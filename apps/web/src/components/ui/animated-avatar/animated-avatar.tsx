/**
 * AnimatedAvatar component — simple avatar renderer with status indicator.
 * CSS border system has been removed; all borders use the Lottie system via ThemedAvatar.
 */

import { durations } from '@cgraph-dev/animation-constants';
import { motion, AnimatePresence } from 'motion/react';

import type { AnimatedAvatarProps } from './types';
import { SIZE_CONFIG, STATUS_COLORS } from './constants';
import { tweens, loop, springs } from '@/lib/animation-presets';

/**
 * Animated Avatar component — renders avatar image with optional status dot.
 */
export default function AnimatedAvatar({
  src,
  alt,
  size = 'md',
  fallbackText,
  className = '',
  onClick,
  showStatus = false,
  statusType = 'offline',
  level,
  isPremium,
  isVerified,
  title,
}: AnimatedAvatarProps) {
  const config = SIZE_CONFIG[size] || SIZE_CONFIG['md']!;
  const currentStatus = statusType ? STATUS_COLORS[statusType] : undefined;
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Main Avatar Container */}
      <motion.div
        className={`${config.container} relative overflow-visible rounded-full`}
        onClick={onClick}
        whileHover={onClick ? { scale: 1.05 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
      >
        {/* Inner Avatar */}
        <div className="relative h-full w-full overflow-hidden rounded-full bg-[var(--token-card-bg)]">
          {src ? (
            <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600">
              <span className="font-bold text-white" style={{ fontSize: config.text }}>
                {fallbackText || (alt ? alt.charAt(0).toUpperCase() : '?')}
              </span>
            </div>
          )}

          {/* Premium/Verified Badge Overlay */}
          {(isPremium || isVerified) && (
            <div className="absolute right-0 top-0 -translate-y-1 translate-x-1 transform">
              {isPremium && (
                <motion.div
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={loop(tweens.ambient)}
                >
                  <span className="text-[8px]">👑</span>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Level Badge */}
      {level !== undefined && level > 0 && (
        <motion.div
          className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 transform rounded-full px-1.5 py-0.5 font-bold text-white"
          style={{
            fontSize: config.levelSize,
            background: 'linear-gradient(135deg, #10b981, var(--color-brand-purple))',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {level}
        </motion.div>
      )}

      {/* Status Indicator */}
      {showStatus && (
        <AnimatePresence mode="wait">
          <motion.div
            key={statusType}
            className={`absolute bottom-0 right-0 ${config.badge} rounded-full ${currentStatus?.bg || 'bg-gray-500'} z-10 border-2 border-[rgb(30,32,40)]`}
            initial={{ scale: 0 }}
            animate={{
              scale: 1,
              boxShadow:
                statusType === 'online' && currentStatus?.glow
                  ? [
                      `0 0 0 0 ${currentStatus.glow}`,
                      `0 0 6px 2px ${currentStatus.glow}`,
                      `0 0 0 0 ${currentStatus.glow}`,
                    ]
                  : `0 0 0 0 transparent`,
            }}
            exit={{ scale: 0 }}
            transition={{
              scale: springs.superBouncy,
              boxShadow:
                statusType === 'online'
                  ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: durations.normal.ms / 1000 },
            }}
          />
        </AnimatePresence>
      )}

      {/* Title Display */}
      {title && (
        <motion.div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 transform whitespace-nowrap"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: `linear-gradient(135deg, ${title.color}40, ${title.color}20)`,
              color: title.color,
              textShadow: `0 0 8px ${title.color}60`,
            }}
          >
            {title.name}
          </span>
        </motion.div>
      )}
    </div>
  );
}
