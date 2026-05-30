import { memo } from 'react';

import {
  getNameplateById,
  NAME_FONTS,
  NAME_FONT_KEYS,
  NAME_EFFECTS,
  NAME_EFFECT_KEYS,
  type NameEffect,
  type NameFont,
} from '@cgraph-dev/animation-constants';

import { LottieAssetRenderer } from '@/lib/lottie/lottie-asset-renderer';
import { cn } from '@/lib/utils';
import type { NameplateProps } from './types';

function getNameFontKey(font?: string): NameFont | null {
  if (!font || font === 'default') {
    return null;
  }

  return NAME_FONT_KEYS.find((key) => key === font) ?? null;
}

function getNameEffectKey(effect?: string): NameEffect | null {
  if (!effect) {
    return null;
  }

  return NAME_EFFECT_KEYS.find((key) => key === effect) ?? null;
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
    letterSpacing: config.letterSpacing != null ? `${config.letterSpacing}px` : undefined,
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
  switch (effect) {
    case 'gradient':
      return {
        background: `linear-gradient(135deg, ${color}, ${secondaryColor ?? color})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      };
    case 'neon':
      return {
        color,
        textShadow: `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}80`,
      };
    case 'toon':
      return {
        color,
        WebkitTextStroke: '1px rgba(0,0,0,0.5)',
        textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
      };
    case 'pop':
      return {
        color,
        textShadow: `3px 3px 0 ${secondaryColor ?? 'rgba(0,0,0,0.3)'}`,
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
  const DisplayNameTag = getDisplayNameTag(headingLevel);

  const hasEntry = entry != null && entry.id !== 'plate_none';

  // Bar background from nameplate entry, or default frosted glass
  const barBg = hasEntry && entry.barGradient
    ? `linear-gradient(135deg, ${entry.barGradient[0]} 0%, ${entry.barGradient[1]} 100%)`
    : 'rgba(255,255,255,0.025)';

  const barBorder =
    hasEntry && entry.borderColor
      ? `1px solid ${entry.borderColor}`
      : '1px solid rgba(255,255,255,0.05)';

  const barShadow =
    hasEntry && entry.borderColor
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
  const effectKey = getNameEffectKey(displayNameEffect);
  const effectConfig = effectKey ? NAME_EFFECTS[effectKey] : null;

  return (
    <div
      className={cn('relative z-[2] flex flex-col items-center px-4 pt-[22px]', className)}
      data-nameplate-id={nameplateId ?? undefined}
      data-display-name-effect={displayNameEffect ?? undefined}
    >
      <div
        className="relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl px-[26px] pb-[10px] pt-2 backdrop-blur-[20px] backdrop-saturate-[1.6]"
        style={{
          background: barBg,
          border: barBorder,
          boxShadow: barShadow,
        }}
      >
        {hasEntry && entry.lottieUrl && (
          <LottieAssetRenderer
            path={entry.lottieUrl}
            fallbackPath="/lottie/nameplates/placeholder.json"
            label={`${entry.name} nameplate`}
            className="pointer-events-none absolute inset-0 z-0 opacity-80"
            fallback={null}
          />
        )}

        {/* Emblem from nameplate entry */}
        {hasEntry && entry.emblem && <span className="relative z-[1] text-sm">{entry.emblem}</span>}

        {/* Display name */}
        <DisplayNameTag
          className={cn(
            'relative z-[1] text-[1.2rem] font-black leading-[1.1] tracking-[0.025em]',
            displayNameClassName
          )}
          style={{
            fontFamily: "'Inter', system-ui",
            ...textStyles,
          }}
        >
          {effectConfig && (
            <LottieAssetRenderer
              path={effectConfig.lottieUrl}
              fallbackPath="/lottie/effects/placeholder.json"
              label={`${effectConfig.label} name effect`}
              className="pointer-events-none absolute inset-[-0.45rem] z-0 opacity-45"
              fallback={null}
            />
          )}
          <span className="relative z-[1]">{displayName}</span>
        </DisplayNameTag>
      </div>
    </div>
  );
});
