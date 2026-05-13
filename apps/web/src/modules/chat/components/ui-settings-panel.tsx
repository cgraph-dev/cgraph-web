/**
 * Chat UI settings panel component.
 */
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { UIPreferences } from './message-bubble';
import { tweens } from '@/lib/animation-presets';

type AnimationIntensity = UIPreferences['animationIntensity'];
type TogglePreferenceKey = 'showParticles' | 'enableGlow' | 'enable3D' | 'enableHaptic';

const GLASS_EFFECT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'frosted', label: 'Frosted' },
  { value: 'crystal', label: 'Crystal' },
  { value: 'neon', label: 'Neon' },
  { value: 'holographic', label: 'Holographic' },
  { value: 'aurora', label: 'Aurora' },
] satisfies ReadonlyArray<{ value: UIPreferences['glassEffect']; label: string }>;

const VOICE_THEME_OPTIONS = [
  { value: 'matrix-green', label: 'Matrix Green' },
  { value: 'cyber-blue', label: 'Cyber Blue' },
  { value: 'neon-pink', label: 'Neon Pink' },
  { value: 'sunset-orange', label: 'Amber' },
] satisfies ReadonlyArray<{ value: UIPreferences['voiceVisualizerTheme']; label: string }>;

const ANIMATION_INTENSITY_OPTIONS = [
  { value: 'low', label: 'Low (Performance)' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High (Beautiful)' },
] satisfies ReadonlyArray<{ value: AnimationIntensity; label: string }>;

const MESSAGE_ANIMATION_OPTIONS = [
  { value: 'slide', label: 'Slide' },
  { value: 'scale', label: 'Scale' },
  { value: 'fade', label: 'Fade' },
  { value: 'bounce', label: 'Bounce' },
] satisfies ReadonlyArray<{ value: UIPreferences['messageEntranceAnimation']; label: string }>;

const TOGGLE_OPTIONS = [
  { key: 'showParticles', label: 'Particles' },
  { key: 'enableGlow', label: 'Glow Effects' },
  { key: 'enable3D', label: '3D Effects' },
  { key: 'enableHaptic', label: 'Haptic' },
] satisfies ReadonlyArray<{ key: TogglePreferenceKey; label: string }>;

function getOptionValue<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  rawValue: string
): T | null {
  const match = options.find((option) => option.value === rawValue);
  return match?.value ?? null;
}

export interface UISettingsPanelProps {
  uiPreferences: UIPreferences;
  setUiPreferences: React.Dispatch<React.SetStateAction<UIPreferences>>;
  updatePreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;
}

/**
 * UISettingsPanel - Next Gen UI Customization panel
 * Allows users to customize visual effects, animations, and themes
 */
export function UISettingsPanel({
  uiPreferences,
  setUiPreferences,
  updatePreference,
}: UISettingsPanelProps) {
  const togglePreference = (key: TogglePreferenceKey): void => {
    setUiPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));

    if (uiPreferences.enableHaptic) {
      HapticFeedback.light();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      transition={tweens.standard}
      className="z-20"
    >
      <GlassCard variant="neon" glow className="mx-4 mt-4 rounded-2xl p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-primary-500/20 pb-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <SparklesIcon className="h-5 w-5 text-primary-400" />
              Next Gen UI Customization
            </h3>
            <span className="rounded-full bg-primary-500/10 px-2 py-1 text-xs text-gray-400">
              BETA
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Glass Effect */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Glass Effect</label>
              <select
                value={uiPreferences.glassEffect}
                onChange={(e) => {
                  const nextValue = getOptionValue(GLASS_EFFECT_OPTIONS, e.target.value);
                  if (nextValue) {
                    updatePreference('glassEffect', nextValue);
                  }
                }}
                className="w-full rounded-lg border border-primary-500/30 bg-[var(--token-card-bg)/0.6] px-3 py-2 text-sm text-white transition-colors focus:border-primary-500 focus:outline-none"
              >
                {GLASS_EFFECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Visualizer Theme */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Voice Theme</label>
              <select
                value={uiPreferences.voiceVisualizerTheme}
                onChange={(e) => {
                  const nextValue = getOptionValue(VOICE_THEME_OPTIONS, e.target.value);
                  if (nextValue) {
                    updatePreference('voiceVisualizerTheme', nextValue);
                  }
                }}
                className="w-full rounded-lg border border-primary-500/30 bg-[var(--token-card-bg)/0.6] px-3 py-2 text-sm text-white transition-colors focus:border-primary-500 focus:outline-none"
              >
                {VOICE_THEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Animation Intensity */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Animation Intensity
              </label>
              <select
                value={uiPreferences.animationIntensity}
                onChange={(e) => {
                  const nextValue = getOptionValue(ANIMATION_INTENSITY_OPTIONS, e.target.value);
                  if (nextValue) {
                    updatePreference('animationIntensity', nextValue);
                  }
                }}
                className="w-full rounded-lg border border-primary-500/30 bg-[var(--token-card-bg)/0.6] px-3 py-2 text-sm text-white transition-colors focus:border-primary-500 focus:outline-none"
              >
                {ANIMATION_INTENSITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Animation */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Message Animation
              </label>
              <select
                value={uiPreferences.messageEntranceAnimation}
                onChange={(e) => {
                  const nextValue = getOptionValue(MESSAGE_ANIMATION_OPTIONS, e.target.value);
                  if (nextValue) {
                    updatePreference('messageEntranceAnimation', nextValue);
                  }
                }}
                className="w-full rounded-lg border border-primary-500/30 bg-[var(--token-card-bg)/0.6] px-3 py-2 text-sm text-white transition-colors focus:border-primary-500 focus:outline-none"
              >
                {MESSAGE_ANIMATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="grid grid-cols-3 gap-3">
            {TOGGLE_OPTIONS.map(({ key, label }) => (
              <motion.button
                key={key}
                onClick={() => togglePreference(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  uiPreferences[key]
                    ? 'bg-primary-500 text-white shadow-[0_0_20px_color-mix(in_srgb,var(--color-brand-purple)_30%,transparent)]'
                    : 'border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.6] text-gray-400'
                }`}
                whileHover={{ opacity: 0.9 }}
                whileTap={{ scale: 0.95 }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default UISettingsPanel;
