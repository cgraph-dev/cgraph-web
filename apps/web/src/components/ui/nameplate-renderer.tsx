import { memo } from 'react';
import type {
  NameplateEntry,
  NameplateTextEffect,
  NameplateBorderStyle,
} from '@cgraph-dev/animation-constants';
import { NameplateScrollText } from '@/components/nameplate/nameplate-scroll-text';
import { LottieAssetRenderer } from '@/lib/lottie/lottie-asset-renderer';

type NameplateSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CONFIG: Record<
  NameplateSize,
  { height: string; fontSize: string; px: string; emblemSize: string; rounded: string }
> = {
  xs: {
    height: 'h-6',
    fontSize: 'text-[10px]',
    px: 'px-2',
    emblemSize: 'text-[10px]',
    rounded: 'rounded',
  },
  sm: {
    height: 'h-8',
    fontSize: 'text-xs',
    px: 'px-2.5',
    emblemSize: 'text-xs',
    rounded: 'rounded-md',
  },
  md: {
    height: 'h-10',
    fontSize: 'text-sm',
    px: 'px-3',
    emblemSize: 'text-sm',
    rounded: 'rounded-lg',
  },
  lg: {
    height: 'h-12',
    fontSize: 'text-base',
    px: 'px-4',
    emblemSize: 'text-base',
    rounded: 'rounded-lg',
  },
};

const IMAGE_NAMEPLATE_WIDTH: Record<NameplateSize, string> = {
  xs: '5.5rem',
  sm: '7.25rem',
  md: '9.5rem',
  lg: '12rem',
};

function getTextEffectStyles(
  effect: NameplateTextEffect,
  primaryColor: string,
  secondaryColor: string | null
): React.CSSProperties {
  switch (effect) {
    case 'glow':
      return {
        textShadow: `0 0 8px ${primaryColor}80, 0 0 20px ${primaryColor}40`,
      };
    case 'metallic':
      return {
        background: `linear-gradient(180deg, ${primaryColor} 0%, ${secondaryColor ?? primaryColor} 50%, ${primaryColor} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
      };
    case 'holographic':
      return {
        background: `linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff, #ff0000)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'nameplate-holo 3s linear infinite',
      };
    case 'fire':
      return {
        background: `linear-gradient(180deg, #ffd700 0%, #ff4500 50%, #8b0000 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 10px rgba(255,69,0,0.5)',
      };
    case 'ice':
      return {
        background: `linear-gradient(180deg, #e0f2fe 0%, #67e8f9 50%, #06b6d4 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 8px rgba(103,232,249,0.4)',
      };
    case 'neon':
      return {
        color: primaryColor,
        textShadow: `0 0 5px ${primaryColor}, 0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}80, 0 0 40px ${primaryColor}40`,
      };
    case 'glitch':
      return {
        color: primaryColor,
        textShadow: `2px 0 ${secondaryColor ?? '#ff0000'}, -2px 0 #00ff00`,
        animation: 'nameplate-glitch 2s infinite',
      };
    case 'rainbow':
      return {
        background: 'linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #8b00ff)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'nameplate-rainbow 4s linear infinite',
      };
    case 'shadow':
      return {
        textShadow: '2px 2px 4px rgba(0,0,0,0.6)',
      };
    case 'emboss':
      return {
        textShadow: '1px 1px 0 rgba(255,255,255,0.2), -1px -1px 0 rgba(0,0,0,0.4)',
      };
    default:
      return {};
  }
}

function getBorderStyles(style: NameplateBorderStyle, color: string | null): React.CSSProperties {
  if (!color || style === 'none') return {};

  switch (style) {
    case 'solid':
      return { border: `1px solid ${color}` };
    case 'gradient':
      return {
        border: '1px solid transparent',
        backgroundClip: 'padding-box',
        boxShadow: `inset 0 0 0 1px ${color}60`,
      };
    case 'animated':
      return {
        border: `1px solid ${color}60`,
        boxShadow: `0 0 8px ${color}30, inset 0 0 4px ${color}10`,
      };
    case 'double':
      return {
        border: `2px double ${color}80`,
      };
    case 'glow':
      return {
        border: `1px solid ${color}40`,
        boxShadow: `0 0 12px ${color}40, 0 0 4px ${color}20`,
      };
    default:
      return {};
  }
}

interface NameplateRendererProps {
  readonly nameplate: NameplateEntry;
  readonly username: string;
  readonly size?: NameplateSize;
  readonly showEmblem?: boolean;
  readonly className?: string;
  readonly width?: string;
}
export const NameplateRenderer = memo(function NameplateRenderer({
  nameplate,
  username,
  size = 'md',
  showEmblem = true,
  className = '',
  width,
}: NameplateRendererProps) {
  const sizeConfig = SIZE_CONFIG[size];

  const barBackground = nameplate.barGradient
    ? `linear-gradient(135deg, ${nameplate.barGradient[0]} 0%, ${nameplate.barGradient[1]} 100%)`
    : 'transparent';

  const textStyles = getTextEffectStyles(
    nameplate.textEffect,
    nameplate.textColor,
    nameplate.textColorSecondary
  );

  const borderStyles = getBorderStyles(nameplate.borderStyle, nameplate.borderColor);
  const imageUrl = nameplate.imageUrl ?? nameplate.previewUrl;
  const hasImageAsset = Boolean(imageUrl);
  const lottiePath =
    nameplate.lottieUrl ??
    (nameplate.lottieFile ? `/lottie/nameplates/${nameplate.lottieFile}` : null);
  const resolvedWidth = width ?? (hasImageAsset ? IMAGE_NAMEPLATE_WIDTH[size] : undefined);

  // "None" selected — render plain text only
  if (nameplate.id === 'plate_none') {
    return (
      <span
        className={`inline-flex items-center font-semibold ${sizeConfig.fontSize} ${className}`}
        style={{ color: nameplate.textColor }}
      >
        {username}
      </span>
    );
  }

  return (
    <div
      className={`cgraph-game-nameplate-frame relative inline-flex items-center justify-center gap-1.5 font-bold ${sizeConfig.height} ${sizeConfig.px} ${
        hasImageAsset ? 'overflow-visible' : `overflow-hidden ${sizeConfig.rounded}`
      } ${className}`}
      style={{
        background: hasImageAsset ? 'transparent' : barBackground,
        ...(hasImageAsset ? {} : borderStyles),
        width: resolvedWidth,
        maxWidth: '100%',
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill"
          loading="lazy"
        />
      ) : lottiePath ? (
        <LottieAssetRenderer
          path={lottiePath}
          fallbackPath="/lottie/nameplates/placeholder.json"
          label={`${nameplate.name} nameplate`}
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
          fallback={null}
        />
      ) : null}
      {!hasImageAsset && (
        <>
          <span className="cgraph-game-nameplate-glow pointer-events-none absolute inset-0 z-[1] rounded-[inherit]" />
          <span className="cgraph-game-nameplate-sheen pointer-events-none absolute inset-y-0 left-0 z-[2] w-1/2" />
        </>
      )}
      {/* Emblem */}
      {showEmblem && nameplate.emblem && (
        <span className={`relative z-10 ${sizeConfig.emblemSize}`}>{nameplate.emblem}</span>
      )}

      {/* Username text with effects */}
      <NameplateScrollText
        text={username}
        className={`relative z-10 min-w-0 max-w-full flex-1 text-center ${sizeConfig.fontSize} font-bold`}
        textStyle={{
          color: nameplate.textColor,
          ...textStyles,
        }}
      />
    </div>
  );
});

export default NameplateRenderer;
