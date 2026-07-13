/**
 * ProfileContent - Avatar, name, title, status, badges, and XP bar
 */

import { durations } from '@cgraph-dev/animation-constants';
import { motion } from 'motion/react';
import { AnimatedAvatar } from '../animated-avatar';
import type { ThemePreset } from '@/modules/settings/store/customization';
import { springs, tweens, loop } from '@/lib/animation-presets';
import { DisplayName, FireText } from '@/shared/components/ui';
import { InlineTitle } from '@/shared/components/ui/inline-title';
import { PREVIEW_BADGES } from './constants';
import type { BadgeDisplay, TitleDisplay } from '@/shared/components/ui/cosmetic-display';
import { resolveEquippedBadges } from '@/shared/components/ui/cosmetic-display';
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
  const equippedNameplate =
    settings.equippedNameplate && settings.equippedNameplate !== 'plate_none'
      ? settings.equippedNameplate
      : null;

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
        {equippedNameplate ? (
          <div className="flex justify-center">
            <NameplateBar
              nameplateId={equippedNameplate}
              username={displayName}
              displayNameFont={settings.displayNameFont}
              displayNameEffect={settings.displayNameEffect}
              displayNameColor={settings.displayNameColor}
              displayNameSecondaryColor={settings.displayNameSecondaryColor}
              width={248}
              height={48}
            />
          </div>
        ) : (
          <DisplayName
            name={displayName}
            font={settings.displayNameFont || 'default'}
            effect={settings.displayNameEffect || 'solid'}
            color={settings.displayNameColor || colors.primary}
            secondaryColor={settings.displayNameSecondaryColor ?? colors.secondary}
            size="1.125rem"
            className="font-bold"
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
            {effectiveTitle ? (
              <InlineTitle titleId={effectiveTitle} size="lg" />
            ) : isLegendaryTitle ? (
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
