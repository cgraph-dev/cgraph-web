/** ThemeCard — displays a selectable theme option with preview and active state. */
import { motion } from 'motion/react';
import { EyeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import type { ThemeCardProps } from './types';

/**
 * ThemeCard Component
 *
 * Displays a single theme option with:
 * - Visual preview based on category (profile/chat/forum/app)
 * - Color palette display
 * - Premium badge and lock indicators
 * - Active/previewing state indicators
 * - Apply button or status display
 */
export function ThemeCard({ theme, isActive, isPreviewing, onApply, delay }: ThemeCardProps) {
  const isHighlighted = isActive || isPreviewing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <GlassCard
        variant={isHighlighted ? 'neon' : 'crystal'}
        glow={isHighlighted}
        glowColor={
          isPreviewing ? 'rgba(234, 179, 8, 0.3)' : isActive ? 'color-mix(in srgb, var(--color-brand-purple) 30%, transparent)' : undefined
        }
        className={`relative cursor-pointer p-4 transition-all ${
          isHighlighted ? 'ring-2 ring-[var(--token-interactive-primary)]/50' : ''
        }`}
        onClick={onApply}
      >
        {/* Preview indicator for locked items */}
        {isPreviewing && (
          <div className="absolute -right-1 -top-1 z-20 flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-black">
            <EyeIcon className="h-3 w-3" />
            Preview
          </div>
        )}

        {/* Theme Preview */}
        <div
          className="relative mb-3 aspect-video overflow-hidden rounded-lg"
          style={{
            background: theme.preview,
          }}
        >
          {/* Mock UI elements in preview */}
          <div className="absolute inset-0 flex items-center justify-center p-3">
            {theme.category === 'profile' && (
              <div className="w-full max-w-[120px] space-y-1">
                <div
                  className="mx-auto h-16 w-16 rounded-full"
                  style={{ backgroundColor: theme.colors.accent }}
                />
                <div
                  className="h-2 rounded"
                  style={{ backgroundColor: theme.colors.text, opacity: 0.8 }}
                />
                <div
                  className="mx-auto h-2 w-2/3 rounded"
                  style={{ backgroundColor: theme.colors.text, opacity: 0.6 }}
                />
              </div>
            )}
            {theme.category === 'chat' && (
              <div className="w-full space-y-2">
                <div
                  className="ml-auto h-6 w-3/4 rounded-lg"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="h-6 w-2/3 rounded-lg"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <div
                  className="ml-auto h-6 w-3/4 rounded-lg"
                  style={{ backgroundColor: theme.colors.primary }}
                />
              </div>
            )}
            {theme.category === 'forum' && (
              <div className="w-full space-y-1">
                <div
                  className="h-3 w-full rounded"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="h-2 w-full rounded"
                  style={{ backgroundColor: theme.colors.text, opacity: 0.6 }}
                />
                <div
                  className="h-2 w-2/3 rounded"
                  style={{ backgroundColor: theme.colors.text, opacity: 0.4 }}
                />
              </div>
            )}
            {theme.category === 'app' && (
              <div className="h-full w-full" style={{ backgroundColor: theme.colors.background }}>
                <div className="h-6 w-full" style={{ backgroundColor: theme.colors.secondary }} />
              </div>
            )}
          </div>

          {/* Premium Badge */}
          {theme.isPremium && (
            <div className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white">
              PREMIUM
            </div>
          )}
        </div>

        {/* Theme Name */}
        <h4 className="mb-1 text-sm font-semibold text-[var(--token-text-primary)]">{theme.name}</h4>

        {/* Theme Description */}
        <p className="mb-3 line-clamp-2 text-xs text-[var(--token-text-muted)]">{theme.description}</p>

        {/* Color Palette */}
        <div className="mb-3 flex gap-1">
          {Object.values(theme.colors)
            .slice(0, 5)
            .map((color, i) => (
              <div
                key={i}
                className="h-4 w-4 rounded-full ring-1 ring-[var(--token-border-muted)]"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
        </div>

        {/* Status / Action */}
        {theme.unlocked ? (
          isActive ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-primary-400/25 bg-gradient-to-r from-primary-500/18 via-violet-500/14 to-primary-400/10 px-4 py-2">
              <CheckCircleIconSolid className="h-5 w-5 text-primary-300" />
              <span className="text-sm font-medium text-primary-200">Active</span>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              className="aurora-social-button w-full rounded-xl px-4 py-2 text-sm font-bold text-white"
            >
              Apply Theme
            </button>
          )
        ) : isPreviewing ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-4 py-2">
            <EyeIcon className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Previewing</span>
          </div>
        ) : (
          <div className="aurora-social-option flex items-center justify-center gap-2 rounded-lg px-4 py-2">
            <EyeIcon className="h-5 w-5 text-white/45" />
            <span className="text-sm text-white/55">Click to preview</span>
          </div>
        )}

        {/* Unlock requirement hint for locked items */}
        {!theme.unlocked && !isPreviewing && (
          <div className="mt-2 flex items-center justify-center gap-1 text-xs text-[var(--token-text-muted)]"><LockClosedIcon className="h-3.5 w-3.5" /> {theme.unlockRequirement}</div>
        )}
      </GlassCard>
    </motion.div>
  );
}
