
/**
 * NameStylesSection Component
 *
 * Displays font, effect, and color pickers for display name customization.
 * Mirrors the mobile NameStylePicker but adapted for the web grid layout.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/modules/auth/store';
import {
  NAME_FONTS,
  NAME_FONT_KEYS,
  NAME_EFFECTS,
  NAME_EFFECT_KEYS,
  NAME_COLORS,
  type NameFont,
  type NameEffect,
} from '@cgraph-dev/animation-constants';
import { GlassCard } from '@/shared/components/ui';
import { tweens } from '@/lib/animation-presets';
import { LottieAssetRenderer } from '@/lib/lottie/lottie-asset-renderer';

// Narrow store strings into the registry union types. Indexed access
// into the readonly arrays returns `T | undefined` under
// noUncheckedIndexedAccess, so we hold a typed default to fall back on.
const DEFAULT_NAME_FONT: NameFont = NAME_FONT_KEYS[0] ?? 'default';
const DEFAULT_NAME_EFFECT: NameEffect = NAME_EFFECT_KEYS[0] ?? 'solid';

function getNameFont(value: string): NameFont {
  return NAME_FONT_KEYS.find((font) => font === value) ?? DEFAULT_NAME_FONT;
}

function getNameEffect(value: string): NameEffect {
  return NAME_EFFECT_KEYS.find((effect) => effect === value) ?? DEFAULT_NAME_EFFECT;
}

export interface NameStylesSectionProps {
  selectedFont: string;
  selectedEffect: string;
  selectedColor: string;
  selectedSecondaryColor: string | null;
  onFontChange: (font: string) => void;
  onEffectChange: (effect: string) => void;
  onColorChange: (color: string) => void;
  onSecondaryColorChange: (color: string | null) => void;
}

/**
 * Display name style preview with the currently selected settings.
 */
function NamePreview({
  font,
  effect,
  color,
  secondaryColor,
  name,
}: {
  font: NameFont;
  effect: NameEffect;
  color: string;
  secondaryColor: string | null;
  name: string;
}) {
  const fontConfig = NAME_FONTS[font] || NAME_FONTS.default;

  const baseStyle: React.CSSProperties = {
    fontSize: '1.75rem',
    fontWeight: fontConfig.fontWeight || '600',
    fontFamily: fontConfig.fontFamily || 'inherit',
    fontStyle: fontConfig.fontStyle || 'normal',
    letterSpacing: fontConfig.letterSpacing ?? 0,
  };

  const secondary = secondaryColor || 'var(--token-interactive-primary)';
  const effectConfig = NAME_EFFECTS[effect];

  const previewText = (() => {
    switch (effect) {
      case 'gradient':
        return (
          <span
            className="relative z-[1]"
            style={{
              ...baseStyle,
              background: `linear-gradient(135deg, ${color}, ${secondary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {name}
          </span>
        );
      case 'neon':
        return (
          <span
            className="relative z-[1]"
            style={{
              ...baseStyle,
              color,
              textShadow: `0 0 7px ${color}, 0 0 10px ${color}, 0 0 21px ${color}, 0 0 42px ${secondary}`,
            }}
          >
            {name}
          </span>
        );
      case 'toon':
        return (
          <span
            className="relative z-[1]"
            style={{
              ...baseStyle,
              color,
              WebkitTextStroke: '1px rgba(0,0,0,0.6)',
              textShadow: `2px 2px 0 rgba(0,0,0,0.3)`,
            }}
          >
            {name}
          </span>
        );
      case 'pop':
        return (
          <span
            className="relative z-[1]"
            style={{
              ...baseStyle,
              color,
              textShadow: `3px 3px 0 ${secondary}, -1px -1px 0 rgba(0,0,0,0.2)`,
            }}
          >
            {name}
          </span>
        );
      default:
        return (
          <span className="relative z-[1]" style={{ ...baseStyle, color }}>
            {name}
          </span>
        );
    }
  })();

  return (
    <span className="relative inline-flex min-h-12 min-w-[12rem] items-center justify-center px-6">
      <LottieAssetRenderer
        path={effectConfig.lottieUrl}
        fallbackPath="/lottie/effects/placeholder.json"
        label={`${effectConfig.label} name effect`}
        className="pointer-events-none absolute inset-0 z-0 opacity-50"
        fallback={null}
      />
      {previewText}
    </span>
  );
}

/**
 * Name styles section for display name customization.
 */
export function NameStylesSection({
  selectedFont,
  selectedEffect,
  selectedColor,
  selectedSecondaryColor,
  onFontChange,
  onEffectChange,
  onColorChange,
  onSecondaryColorChange,
}: NameStylesSectionProps) {
  const [customColor, setCustomColor] = useState(selectedColor);
  // Pull the user's actual display name (or username fallback) so the
  // preview matches what the rest of the app will render. Telegram
  // parity: NameColorPicker preview uses the live first/last name.
  const previewName = useAuthStore(
    (s) => s.user?.displayName || s.user?.username || 'Your name'
  );
  const needsSecondary =
    selectedEffect === 'gradient' || selectedEffect === 'neon' || selectedEffect === 'pop';

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <GlassCard variant="holographic" className="flex items-center justify-center p-12 overflow-hidden rounded-2xl border-[var(--token-card-border)] bg-[var(--token-bg-secondary)/0.3] shadow-2xl backdrop-blur-3xl ring-1 ring-[var(--token-border-muted)]">
        <NamePreview
          font={getNameFont(selectedFont)}
          effect={getNameEffect(selectedEffect)}
          color={selectedColor}
          secondaryColor={selectedSecondaryColor}
          name={previewName}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
      </GlassCard>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--token-text-secondary)]">Font Style</h3>
        <div className="grid grid-cols-4 gap-3">
          {NAME_FONT_KEYS.map((fontKey) => {
            const config = NAME_FONTS[fontKey];
            const isSelected = fontKey === selectedFont;
            return (
              <Button
                key={fontKey}
                variant={isSelected ? 'primary' : 'glass'}
                onClick={() => onFontChange(fontKey)}
                className={`group relative rounded-xl px-4 py-6 transition-all duration-300 ${
                  isSelected
                    ? 'aurora-social-button border-primary-400/30 bg-gradient-to-r from-primary-500/70 via-violet-500/60 to-primary-400/45 text-white ring-0 scale-[1.02] shadow-[0_12px_30px_rgba(76,29,149,0.35)]'
                    : 'aurora-social-button-muted text-white/72 hover:scale-[1.02] hover:text-white'
                }`}
                style={{
                  fontFamily: config.fontFamily || 'inherit',
                  fontWeight: config.fontWeight || '400',
                  fontStyle: config.fontStyle || 'normal',
                  letterSpacing: config.letterSpacing ?? 0,
                  borderWidth: '1px',
                }}
              >
                {config.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--token-text-secondary)]">Text Effect</h3>
        <div className="grid grid-cols-5 gap-3">
          {NAME_EFFECT_KEYS.map((effectKey) => {
            const config = NAME_EFFECTS[effectKey];
            const isSelected = effectKey === selectedEffect;
            return (
              <Button
                key={effectKey}
                variant={isSelected ? 'primary' : 'glass'}
                onClick={() => onEffectChange(effectKey)}
                className={`group flex flex-col h-auto items-center justify-center rounded-xl p-4 transition-all duration-300 ${
                  isSelected
                    ? 'aurora-social-button border-primary-400/30 bg-gradient-to-r from-primary-500/70 via-violet-500/60 to-primary-400/45 text-white ring-0 scale-[1.02] shadow-[0_12px_30px_rgba(76,29,149,0.35)]'
                    : 'aurora-social-button-muted text-white/72 hover:scale-[1.02] hover:text-white'
                }`}
              >
                <div className="relative mb-2 h-8 w-full overflow-hidden rounded-lg border border-white/5 bg-black/10">
                  <LottieAssetRenderer
                    path={config.lottieUrl}
                    fallbackPath="/lottie/effects/placeholder.json"
                    label={`${config.label} name effect preview`}
                    className="pointer-events-none absolute inset-0 opacity-70"
                    fallback={null}
                  />
                  <div className="relative z-[1] flex h-full items-center justify-center text-sm font-bold tracking-tight">
                    {config.label}
                  </div>
                </div>
                <div className={`mt-1 text-[10px] leading-tight transition-colors border-none font-medium ${
                  isSelected ? 'text-[var(--token-text-secondary)]' : 'text-[var(--token-text-muted)] group-hover:text-[var(--token-text-secondary)]'
                }`}>{config.description}</div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--token-text-secondary)]">
          {needsSecondary ? 'Primary Color' : 'Text Color'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {NAME_COLORS.map((color) => (
            <motion.button
              key={color}
              onClick={() => onColorChange(color)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                color === selectedColor
                  ? 'border-[var(--token-interactive-primary)] ring-2 ring-[var(--token-interactive-primary)] shadow-[0_0_15px_rgba(223,255,10,0.3)]'
                  : 'border-transparent hover:border-[var(--token-card-border)]'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          {/* Custom color input */}
          <div className="relative">
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                onColorChange(e.target.value);
              }}
              className="absolute inset-0 h-8 w-8 cursor-pointer opacity-0"
            />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs ${
                NAME_COLORS.includes(selectedColor) ? 'border-[var(--token-border-muted)]' : 'border-[var(--token-interactive-primary)]'
              }`}
              style={{ backgroundColor: customColor }}
            >
              +
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Color (for gradient/neon/pop) */}
      {needsSecondary && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={tweens.fast}
        >
          <h3 className="mb-3 text-sm font-semibold text-[var(--token-text-secondary)]">Secondary Color</h3>
          <div className="flex flex-wrap gap-2">
            {NAME_COLORS.map((color) => (
              <motion.button
                key={color}
                onClick={() => onSecondaryColorChange(color)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  color === selectedSecondaryColor
                    ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.4)] border-white'
                    : 'border-transparent hover:border-white/40'
                }`}
                style={{ backgroundColor: color }}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
