import { memo } from 'react';

import type { BannerProps } from './types';

export const BannerCanvas = memo(function BannerCanvas({
  bannerType: _bannerType,
  accentColor,
  bannerBackground,
  backgroundImage,
  variant = 'full',
}: BannerProps) {
  const isMini = variant === 'mini';

  return (
    <div
      className={`relative overflow-hidden rounded-t-[21px] ${isMini ? 'h-[104px]' : 'h-[136px]'}`}
      data-profile-card-banner-variant={variant}
      data-profile-theme-header-image={backgroundImage ?? undefined}
      style={{ background: bannerBackground }}
    >
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
          loading="lazy"
        />
      )}
      {backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-[#08090f]/72" />
      )}
      <div
        className="absolute inset-0 opacity-75 mix-blend-screen"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 18px), radial-gradient(circle at 50% 8%, ${accentColor}42, transparent 34%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-12 bg-gradient-to-b from-white/[0.08] to-transparent" />
      <div
        className="pointer-events-none absolute -left-12 top-1/4 z-[2] h-24 w-24 rounded-full blur-2xl"
        style={{ background: `color-mix(in srgb, ${accentColor} 20%, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -right-12 top-1/4 z-[2] h-24 w-24 rounded-full blur-2xl"
        style={{ background: `color-mix(in srgb, ${accentColor} 16%, transparent)` }}
      />
      <div
        className="absolute inset-x-5 top-5 z-[3] h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />
      <div
        className={`pointer-events-none absolute inset-x-8 bottom-0 z-[4] rounded-t-full border-x border-t border-white/[0.08] ${isMini ? 'h-5' : 'h-7'}`}
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 16%, rgba(8,9,15,0.66)) 0%, rgba(8,9,15,0.92) 100%)`,
          boxShadow: `0 -12px 34px color-mix(in srgb, ${accentColor} 14%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-16 bg-gradient-to-b from-transparent to-[#08090f]" />
    </div>
  );
});
