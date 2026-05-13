/**
 * ProfileContent - Avatar, name, title, status, badges, and XP bar
 */

import { durations, NAME_FONTS } from '@cgraph/animation-constants';
import type { NameFont } from '@cgraph/animation-constants';
import { motion } from 'motion/react';

function isNameFont(value: string): value is NameFont {
  return value in NAME_FONTS;
}
import { AnimatedAvatar } from '../animated-avatar';
import type { ThemePreset, TitleDisplay } from '@/modules/settings/store/customization';
import { springs, tweens, loop } from '@/lib/animation-presets';
import { GlowText, FireText } from '@/shared/components/ui';
import { PREVIEW_BADGES } from './constants';
import { resolveEquippedBadges } from '@/modules/settings/store/customization/mappings';
import type { BadgeDisplay } from '@/modules/settings/store/customization/mappings';
import type { ThemeColors, PreviewBadge } from './types';
import { NameplateBar } from '@/components/nameplate';

interface ProfileContentProps {
  displayName: string;
  settings: {
    avatarSize: 'small' | 'medium' | 'large' | number;
    glowEnabled: boolean;
    showBadges: boolean;
    showStatus: boolean;
    displayNameFont?: string;
    displayNameEffect?: string;
    displayNameColor?: string;
    displayNameSecondaryColor?: string | null;
    equippedNameplate?: string | null;
    profileThemePresetId?: string | null;
    profileThemePrimary?: string | null;
    profileThemeAccent?: string | null;
  };
  colors: ThemeColors;
  effectiveBorderType: 'none' | 'lottie';
  effectiveColorPreset: ThemePreset;
  effectiveTitle: string | null;
  titleInfo: TitleDisplay | null;
  isLegendaryTitle: boolean;
  speedMultiplier: number;
  equippedBadges?: string[];
  /** Lottie JSON URL for 'lottie' border type. */
  lottieUrl?: string;
}

/**
 * Renders the display name with the selected font and text effect.
 */
function StyledDisplayName({
  displayName,
  font,
  effect,
  color,
  secondaryColor,
  fallbackGradient,
}: {
  /** Display name to render. */
  displayName: string;
  /** Selected font key from NAME_FONTS registry. */
  font: string;
  /** Selected text effect (solid, gradient, neon, toon, pop). */
  effect: string;
  /** Primary text color hex. */
  color: string;
  /** Secondary color for gradient/neon/pop effects. */
  secondaryColor: string | null;
  /** Fallback gradient when using the default solid effect. */
  fallbackGradient: [string, string];
}) {
  const fontKey: NameFont = isNameFont(font) ? font : 'default';
  const fontConfig = NAME_FONTS[fontKey];
  const secondary = secondaryColor || fallbackGradient[1];

  const baseStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: fontConfig.fontWeight || '700',
    fontFamily: fontConfig.fontFamily || 'inherit',
    fontStyle: fontConfig.fontStyle || 'normal',
    letterSpacing: fontConfig.letterSpacing ?? 0,
    lineHeight: 1.3,
  };

  switch (effect) {
    case 'gradient':
      return (
        <h4
          style={{
            ...baseStyle,
            background: `linear-gradient(135deg, ${color}, ${secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {displayName}
        </h4>
      );
    case 'neon':
      return (
        <h4
          style={{
            ...baseStyle,
            color,
            textShadow: `0 0 7px ${color}, 0 0 10px ${color}, 0 0 21px ${color}, 0 0 42px ${secondary}`,
          }}
        >
          {displayName}
        </h4>
      );
    case 'toon':
      return (
        <h4
          style={{
            ...baseStyle,
            color,
            WebkitTextStroke: '1px rgba(0,0,0,0.6)',
            textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
          }}
        >
          {displayName}
        </h4>
      );
    case 'pop':
      return (
        <h4
          style={{
            ...baseStyle,
            color,
            textShadow: `3px 3px 0 ${secondary}, -1px -1px 0 rgba(0,0,0,0.2)`,
          }}
        >
          {displayName}
        </h4>
      );
    default:
      // Solid: if font is default and color is still white, use the theme
      // gradient via GlowText for backward compatibility
      if (fontKey === 'default' && color === '#ffffff') {
        return (
          <GlowText
            as="h4"
            gradient={fallbackGradient}
            size="lg"
            animate={true}
            glowIntensity="medium"
          >
            {displayName}
          </GlowText>
        );
      }
      return <h4 style={{ ...baseStyle, color }}>{displayName}</h4>;
  }
}

/**
 * Profile Content component.
 */
export function ProfileContent({
  displayName,
  settings,
  colors,
  effectiveBorderType,
  effectiveColorPreset,
  effectiveTitle,
  titleInfo,
  isLegendaryTitle,
  speedMultiplier,
  equippedBadges = [],
  lottieUrl,
}: ProfileContentProps) {
  // Resolve equipped badge IDs to display data; fall back to default preview badges
  const resolvedBadges: (BadgeDisplay | PreviewBadge)[] =
    equippedBadges.length > 0 ? resolveEquippedBadges(equippedBadges) : PREVIEW_BADGES;
  return (
    <div className="relative z-10 flex flex-col items-center">
      {/* Avatar */}
      <AnimatedAvatar
        borderType={effectiveBorderType}
        borderColor={effectiveColorPreset}
        size={settings.avatarSize}
        speedMultiplier={speedMultiplier}
        lottieUrl={lottieUrl}
      />

      {/* Name & Title & Status */}
      <div className="mt-3 text-center">
        {settings.equippedNameplate ? (
          <div className="flex justify-center">
            <NameplateBar
              nameplateId={settings.equippedNameplate}
              username={displayName}
              width={240}
              height={36}
            />
          </div>
        ) : (
          <StyledDisplayName
            displayName={displayName}
            font={settings.displayNameFont || 'default'}
            effect={settings.displayNameEffect || 'solid'}
            color={settings.displayNameColor || '#ffffff'}
            secondaryColor={settings.displayNameSecondaryColor ?? null}
            fallbackGradient={[colors.primary, colors.secondary]}
          />
        )}

        {/* Title Display */}
        {titleInfo && (
          <motion.div
            className="mt-1"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={effectiveTitle}
          >
            {isLegendaryTitle ? (
              <FireText size="sm">{titleInfo.name}</FireText>
            ) : (
              <span className={`text-xs font-medium ${titleInfo.gradient}`}>{titleInfo.name}</span>
            )}
          </motion.div>
        )}

        {settings.showStatus && (
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <motion.span
              className="h-2 w-2 rounded-full bg-primary-300"
              animate={{
                scale: [1, 1.2, 1],
                boxShadow: [
                  '0 0 4px rgba(147, 197, 253, 0.45)',
                  '0 0 8px rgba(147, 197, 253, 0.75)',
                  '0 0 4px rgba(147, 197, 253, 0.45)',
                ],
              }}
              transition={loop(tweens.ambient)}
            />
            <span className="text-xs text-primary-300">Online</span>
          </div>
        )}
      </div>

      {/* Badges */}
      {settings.showBadges && resolvedBadges.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {resolvedBadges.map((badge, i) => {
            const icon = 'icon' in badge ? badge.icon : badge.emoji;
            const { color } = badge;
            const name = 'name' in badge ? badge.name : undefined;
            return (
              <motion.div
                key={'name' in badge ? badge.name : i}
                className="group relative flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                style={{
                  background: `${color}30`,
                  boxShadow: settings.glowEnabled ? `0 0 10px ${color}50` : 'none',
                }}
                animate={
                  settings.glowEnabled
                    ? {
                        boxShadow: [
                          `0 0 10px ${color}50`,
                          `0 0 20px ${color}70`,
                          `0 0 10px ${color}50`,
                        ],
                      }
                    : undefined
                }
                whileHover={{ rotate: 5 }}
                transition={{
                  ...springs.bouncy,
                  duration: durations.loop.ms / 1000,
                  repeat: settings.glowEnabled ? Infinity : 0,
                  delay: i * 0.3,
                }}
              >
                <motion.div
                  className="absolute -inset-1 rounded-lg opacity-50"
                  style={{
                    background: `conic-gradient(from 0deg, transparent, ${color}, transparent)`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={loop(tweens.glacial)}
                />
                <span className="relative z-10">{icon}</span>
                {/* Tooltip with badge name */}
                {name && (
                  <div className="pointer-events-none absolute -bottom-7 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[9px] text-white/90 opacity-0 transition-opacity group-hover:opacity-100">
                    {name}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
