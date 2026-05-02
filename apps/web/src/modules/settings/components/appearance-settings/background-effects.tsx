/**
 * Background Effects Section
 *
 * Shader effects and intensity settings.
 */

import { SparklesIcon } from '@heroicons/react/24/outline';

import { SectionHeader } from './section-header';

// TYPES

type BackgroundEffect = 'none' | 'shader' | 'matrix3d';
type ShaderVariant = 'matrix' | 'fluid' | 'particles' | 'waves' | 'neural';

interface BackgroundEffectsProps {
  /** Current background effect */
  backgroundEffect: BackgroundEffect;
  /** Current shader variant */
  shaderVariant: ShaderVariant;
  /** Current intensity */
  backgroundIntensity: number;
  /** Callback to update settings */
  updateSettings: (settings: {
    backgroundEffect?: BackgroundEffect;
    shaderVariant?: ShaderVariant;
    backgroundIntensity?: number;
  }) => void;
}

// CONSTANTS

const EFFECT_OPTIONS: BackgroundEffect[] = ['none', 'shader'];
const SHADER_VARIANTS: ShaderVariant[] = ['matrix', 'fluid', 'particles', 'waves', 'neural'];

// COMPONENT

export function BackgroundEffects({
  backgroundEffect,
  shaderVariant,
  backgroundIntensity,
  updateSettings,
}: BackgroundEffectsProps) {
  return (
    <section>
      <SectionHeader
        icon={<SparklesIcon className="h-5 w-5" />}
        title="Background Effects"
        description="Add dynamic visual effects to the app background"
      />

      <div className="space-y-4">
        {/* Effect Type */}
        <div className="grid grid-cols-3 gap-3">
          {EFFECT_OPTIONS.map((effect) => (
            <button
              key={effect}
              onClick={() => updateSettings({ backgroundEffect: effect })}
              className={`${
                backgroundEffect === effect
                  ? 'aurora-social-button text-[var(--token-text-primary)]'
                  : 'aurora-social-button-muted text-[var(--token-text-secondary)]'
              } rounded-xl px-4 py-3 capitalize transition-all`}
            >
              {effect === 'none' ? 'Off' : 'Shader Effects'}
            </button>
          ))}
        </div>

        {/* Shader Variant */}
        {backgroundEffect === 'shader' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--token-text-secondary)]">
              Effect Style
            </label>
            <div className="grid grid-cols-5 gap-2">
              {SHADER_VARIANTS.map((variant) => (
                <button
                  key={variant}
                  onClick={() => updateSettings({ shaderVariant: variant })}
                  className={`${
                    shaderVariant === variant
                      ? 'aurora-social-button text-[var(--token-text-primary)]'
                      : 'aurora-social-button-muted text-[var(--token-text-secondary)]'
                  } rounded-xl px-3 py-2 text-xs capitalize transition-all`}
                >
                  {variant}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Intensity Slider */}
        {backgroundEffect !== 'none' && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-[var(--token-text-secondary)]">
                Intensity
              </label>
              <span className="text-sm text-[var(--token-text-muted)]">
                {Math.round((backgroundIntensity || 0.6) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.1}
              value={backgroundIntensity || 0.6}
              onChange={(e) => updateSettings({ backgroundIntensity: parseFloat(e.target.value) })}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[var(--token-bg-tertiary)] accent-primary-500"
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default BackgroundEffects;
