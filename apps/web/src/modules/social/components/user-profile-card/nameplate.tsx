import { memo } from 'react';

import {
  NAME_FONTS,
  NAME_FONT_KEYS,
  getNameplateById,
  type NameFont,
} from '@cgraph-dev/animation-constants';

import { NameplateScrollText } from '@/components/nameplate/nameplate-scroll-text';
import { LottieAssetRenderer } from '@/lib/lottie/lottie-asset-renderer';
import { cn } from '@/lib/utils';
import type { NameplateProps } from './types';

const PROFILE_IMAGE_NAMEPLATE_SIZE = {
  width: 'min(15.5rem, 100%)',
  height: '3rem',
} as const;

function getNameFontKey(font?: string): NameFont | null {
  if (!font || font === 'default') {
    return null;
  }

  return NAME_FONT_KEYS.find((key) => key === font) ?? null;
}

function getFontWeight(fontWeight: unknown): React.CSSProperties['fontWeight'] | undefined {
  return typeof fontWeight === 'string' || typeof fontWeight === 'number' ? fontWeight : undefined;
}

function getNameFontStyles(font?: string): React.CSSProperties {
  const fontKey = getNameFontKey(font);
  if (!fontKey) return {};

  const config = NAME_FONTS[fontKey];
  if (!config) return {};

  return {
    fontFamily: config.fontFamily,
    fontWeight: getFontWeight(config.fontWeight),
    fontStyle: config.fontStyle,
    letterSpacing:
      config.letterSpacing != null ? `${Math.max(0, config.letterSpacing)}px` : undefined,
  };
}

function getNameEffectStyles(
  effect?: string,
  color?: string,
  secondaryColor?: string | null
): React.CSSProperties {
  if (!effect || effect === 'solid' || !color) {
    return color ? { color } : {};
  }
  const secondary = secondaryColor ?? color;
  const vars: React.CSSProperties & Record<`--${string}`, string> = {
    '--cgraph-name-primary': color,
    '--cgraph-name-secondary': secondary,
    '--cgraph-name-shadow': 'rgba(0,0,0,0.45)',
  };
  switch (effect) {
    case 'gradient':
      return {
        ...vars,
        color,
        textShadow: `0 0 10px ${secondary}66`,
      };
    case 'neon':
      return {
        ...vars,
        color,
        textShadow: `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}80`,
      };
    case 'toon':
      return {
        ...vars,
        color,
        WebkitTextStroke: '1px rgba(0,0,0,0.5)',
        textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
      };
    case 'pop':
      return {
        ...vars,
        color,
        textShadow: `3px 3px 0 ${secondary}`,
      };
    case 'holo':
      return {
        ...vars,
        color,
        textShadow: `1px 0 #7dd3fc, -1px 0 #f0abfc, 0 0 14px ${secondary}66`,
        animation: 'cgraph-display-gradient-pan 3.8s linear infinite',
      };
    case 'glitch':
      return {
        ...vars,
        color,
        textShadow: '1px 0 #22d3ee, -1px 0 #f472b6',
        animation: 'cgraph-display-glitch 2.4s steps(1, end) infinite',
      };
    case 'chrome':
      return {
        ...vars,
        color,
        textShadow: `0 1px 0 rgba(0,0,0,0.6), 0 0 12px ${secondary}55`,
      };
    case 'pulse':
      return {
        ...vars,
        color,
        animation: 'cgraph-display-pulse 2.6s ease-in-out infinite',
      };
    case 'ember':
      return {
        ...vars,
        color,
        animation: 'cgraph-display-ember 2.1s ease-in-out infinite',
      };
    case 'frost':
      return {
        ...vars,
        color,
        animation: 'cgraph-display-frost 3.2s ease-in-out infinite',
        textShadow: `0 0 7px #7dd3fc, 0 0 16px ${secondary}66`,
      };
    default:
      return color ? { color } : {};
  }
}

function getDisplayNameTag(headingLevel?: 1 | 2 | 3 | 4 | 5 | 6) {
  switch (headingLevel) {
    case 1:
      return 'h1';
    case 2:
      return 'h2';
    case 3:
      return 'h3';
    case 4:
      return 'h4';
    case 5:
      return 'h5';
    case 6:
      return 'h6';
    default:
      return 'span';
  }
}

export const Nameplate = memo(function Nameplate({
  displayName,
  nameplateId,
  displayNameFont,
  displayNameEffect,
  displayNameColor,
  displayNameSecondaryColor,
  className,
  displayNameClassName,
  headingLevel,
}: NameplateProps) {
  const entry = nameplateId ? getNameplateById(nameplateId) : undefined;
  const imageUrl = entry?.imageUrl ?? entry?.previewUrl;
  const hasImageAsset = Boolean(imageUrl);
  const DisplayNameTag = getDisplayNameTag(headingLevel);

  const hasEntry = entry != null && entry.id !== 'plate_none';

  // Bar background from nameplate entry, or default frosted glass
  const barBg = hasImageAsset
    ? 'transparent'
    : hasEntry && entry.barGradient
      ? `linear-gradient(135deg, ${entry.barGradient[0]} 0%, ${entry.barGradient[1]} 100%)`
      : 'rgba(255,255,255,0.025)';

  const barBorder =
    hasImageAsset
      ? '0 solid transparent'
      : hasEntry && entry.borderColor
      ? `1px solid ${entry.borderColor}`
      : '1px solid rgba(255,255,255,0.05)';

  const barShadow =
    hasImageAsset
      ? 'none'
      : hasEntry && entry.borderColor
      ? `0 0 12px ${entry.borderColor}30, 0 4px 16px rgba(0,0,0,0.55)`
      : '0 4px 16px rgba(0,0,0,0.4)';

  // Text styles: user's name style settings take priority over nameplate text styling
  const hasCustomTextStyle = !!(
    displayNameColor ||
    (displayNameEffect && displayNameEffect !== 'solid') ||
    (displayNameFont && displayNameFont !== 'default')
  );

  const textStyles: React.CSSProperties = (() => {
    if (hasCustomTextStyle) {
      return {
        ...getNameFontStyles(displayNameFont),
        ...getNameEffectStyles(displayNameEffect, displayNameColor, displayNameSecondaryColor),
      };
    }
    // Fall back to nameplate's own text color
    if (hasEntry) {
      return { color: entry.textColor };
    }
    return { color: '#edf0f8' };
  })();
  return (
    <div
      className={cn(
        'relative z-[2] flex w-full max-w-full flex-col items-center px-4',
        hasImageAsset ? 'pt-1' : 'pt-[22px]',
        className
      )}
      data-nameplate-id={nameplateId ?? undefined}
      data-display-name-effect={displayNameEffect ?? undefined}
    >
      <div
        className={cn(
          'cgraph-game-nameplate-frame relative inline-flex max-w-full items-center justify-center gap-1.5 rounded-xl',
          hasImageAsset ? 'px-[34px] py-0' : 'px-[26px] pb-[10px] pt-2',
          hasImageAsset
            ? 'overflow-visible'
            : 'overflow-hidden backdrop-blur-[20px] backdrop-saturate-[1.6]'
        )}
        style={{
          background: barBg,
          border: barBorder,
          boxShadow: barShadow,
          ...(hasImageAsset ? PROFILE_IMAGE_NAMEPLATE_SIZE : {}),
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill"
            loading="lazy"
          />
        ) : hasEntry && entry.lottieUrl ? (
          <LottieAssetRenderer
            path={entry.lottieUrl}
            fallbackPath="/lottie/nameplates/placeholder.json"
            label={`${entry.name} nameplate`}
            className="pointer-events-none absolute inset-0 z-0 opacity-80"
            fallback={null}
          />
        ) : null}
        {hasEntry && !hasImageAsset && (
          <span className="cgraph-game-nameplate-glow pointer-events-none absolute inset-0 z-[1] rounded-[inherit]" />
        )}

        {/* Emblem from nameplate entry */}
        {hasEntry && !hasImageAsset && entry.emblem && (
          <span className="relative z-[1] text-sm">{entry.emblem}</span>
        )}

        {/* Display name */}
        <NameplateScrollText
          as={DisplayNameTag}
          text={displayName}
          className={cn(
            'relative z-[1] block min-w-0 max-w-full text-center text-[1.2rem] font-black leading-none tracking-[0.025em]',
            displayNameClassName
          )}
          textStyle={{
            fontFamily: "'Inter', system-ui",
            ...textStyles,
          }}
          overlay={null}
        />
      </div>
    </div>
  );
});
