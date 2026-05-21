/**
 * Animated Avatar Component (Customization Panel)
 *
 * Renders avatar preview with Lottie border in the customization settings.
 * CSS-based border effects have been removed — all borders use the Lottie system.
 *
 */

import { memo } from 'react';
import { LottieBorderRenderer } from '@/lib/lottie/lottie-border-renderer';
import type { ThemePreset } from '@/modules/settings/store/customization';

interface AnimatedAvatarProps {
  borderType: 'none' | 'lottie';
  borderColor: ThemePreset;
  size: 'small' | 'medium' | 'large' | number;
  speedMultiplier?: number;
  src?: string;
  initials?: string;
  /** Lottie JSON URL for 'lottie' border type. */
  lottieUrl?: string;
}

const sizeMap = { small: 48, medium: 64, large: 80 };

export type BorderType = 'none' | 'lottie';

export const AnimatedAvatar = memo(function AnimatedAvatar({
  borderType,
  size,
  speedMultiplier = 1,
  src,
  initials = 'CG',
  lottieUrl,
}: AnimatedAvatarProps) {
  const avatarSize = typeof size === 'number' ? size : sizeMap[size];

  const avatarImage = (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gray-700 to-gray-800"
      style={{ width: avatarSize - 4, height: avatarSize - 4 }}
    >
      {src ? (
        <img src={src} alt="Avatar" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className="text-xl font-bold text-white">{initials}</span>
      )}
    </div>
  );

  // No border — render plain avatar
  if (borderType === 'none' || !lottieUrl) {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: avatarSize + 24, height: avatarSize + 24 }}
      >
        <div className="relative z-10">{avatarImage}</div>
      </div>
    );
  }

  // Lottie border
  const frameSize = avatarSize + 28;
  const outerSize = frameSize + 8;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: outerSize, height: outerSize }}
    >
      <LottieBorderRenderer
        lottieUrl={lottieUrl}
        avatarSize={avatarSize - 8}
        borderWidth={Math.round((frameSize - (avatarSize - 8)) / 2)}
        lottieConfig={{ speed: speedMultiplier }}
      >
        {avatarImage}
      </LottieBorderRenderer>
    </div>
  );
});

export default AnimatedAvatar;
