import { memo } from 'react';

import {
  getNameplateById,
  NAME_FONTS,
  NAME_FONT_KEYS,
  type NameFont,
} from '@cgraph/animation-constants';

import type { NameplateProps } from './types';

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
export const Nameplate = memo(function Nameplate({
  displayName,
  nameplateId,
  displayNameFont,
  displayNameEffect,
  displayNameColor,
  displayNameSecondaryColor,
}: NameplateProps) {
  const entry = nameplateId ? getNameplateById(nameplateId) : undefined;

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

  return (
    <div className="relative z-[2] flex flex-col items-center px-4 pt-[22px]">
      <div
        className="relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl px-[26px] pb-[10px] pt-2 backdrop-blur-[20px] backdrop-saturate-[1.6]"
        style={{
          background: barBg,
          border: barBorder,
          boxShadow: barShadow,
        }}
      >
        {/* Emblem from nameplate entry */}
        {hasEntry && entry.emblem && <span className="relative z-[1] text-sm">{entry.emblem}</span>}

        {/* Shimmer sweep */}
        <div
          className="pointer-events-none absolute top-0 h-full w-[65%]"
          style={{
            left: '-70%',
            background:
              'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.065) 50%, transparent 75%)',
            animation: 'pc-nameplate-sheen 4.5s ease-in-out infinite',
          }}
        />

        {/* Display name */}
        <span
          className="relative z-[1] text-[1.2rem] font-black leading-[1.1] tracking-[0.025em]"
          style={{
            fontFamily: "'Inter', system-ui",
            ...textStyles,
          }}
        >
          {displayName}
        </span>
      </div>
    </div>
  );
});
