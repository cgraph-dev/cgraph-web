/**
 * LivePreviewPanel - Main component
 *
 * Real-time preview of all customization settings.
 * Shows profile card, avatar, and chat bubbles with live updates.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useShallow } from 'zustand/react/shallow';
import {
  useCustomizationStore,
  THEME_COLORS as themeColors,
  PROFILE_THEME_TO_COLOR,
} from '@/modules/settings/store/customization';
import { ProfileCardPreview } from './profile-card-preview';
import { tweens, loop } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';

export const LivePreviewPanel = memo(function LivePreviewPanel() {
  // Get store states with shallow comparison
  const settings = useCustomizationStore(
    useShallow((state) => ({
      themePreset: state.themePreset,
      isSaving: state.isSaving,
      isDirty: state.isDirty,
      profileTheme: state.profileTheme,
    }))
  );

  const { isSaving, isDirty } = settings;

  // Determine effective color from profile theme
  const effectiveColorPreset =
    (settings.profileTheme && PROFILE_THEME_TO_COLOR[settings.profileTheme]) ||
    settings.themePreset;
  const colors = themeColors[effectiveColorPreset];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-2 pl-1 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h3 className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            Live Preview
          </h3>
          <p className="text-[11px] font-medium text-white/40">See your changes in real-time</p>
        </div>

        {/* Sync indicator */}
        <AnimatePresence mode="wait">
          {isSaving ? (
            <motion.div
              key="saving"
              {...FADE_IN}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-2 py-1"
            >
              <motion.div
                className="h-2 w-2 rounded-full bg-yellow-400"
                animate={{ scale: [1, 1.2, 1] }}
                transition={loop(tweens.smooth)}
              />
              <span className="text-[10px] text-yellow-400">Saving...</span>
            </motion.div>
          ) : isDirty ? (
            <motion.div
              key="unsaved"
              {...FADE_IN}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-full bg-orange-500/20 px-2 py-1"
            >
              <div className="h-2 w-2 rounded-full bg-orange-400" />
              <span className="text-[10px] text-orange-400">Unsaved</span>
            </motion.div>
          ) : (
            <motion.div
              key="saved"
              {...FADE_IN}
              exit={{ opacity: 0 }}
              className="bg-primary-500/10 ring-primary-500/20 flex items-center gap-1.5 rounded-full px-2 py-1 ring-1"
            >
              <div className="h-2 w-2 rounded-full bg-primary-300" />
              <span className="text-[10px] text-primary-300">Saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Preview */}
      <div className="mb-6">
        <ProfileCardPreview />
      </div>

      {/* Quick Stats */}
      <div className="mt-4 rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-primary)] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.4),rgba(255,255,255,0.02)_0px_1px_1px_inset] backdrop-blur-3xl">
        <div className="flex items-center justify-between text-[11px] font-medium">
          <span className="text-white/40">Active Theme</span>
          <span
            className="rounded bg-[var(--token-bg-secondary)] px-2 py-0.5"
            style={{ color: colors.primary, textShadow: `0 0 10px ${colors.glow}` }}
          >
            {colors.name}
          </span>
        </div>
      </div>
    </div>
  );
});

export default LivePreviewPanel;
