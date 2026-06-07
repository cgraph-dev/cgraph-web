import { memo } from 'react';

import type { BannerProps } from './types';

export const BannerCanvas = memo(function BannerCanvas({
  bannerType: _bannerType,
  accentColor,
  bannerBackground,
  backgroundImage,
}: BannerProps) {
  return (
    <div
      className="relative h-[116px] overflow-hidden rounded-t-[21px]"
      style={{ background: bannerBackground }}
    >
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      )}
      {backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-[#08090f]/60" />
      )}
      <div
        className="absolute inset-0 opacity-80 mix-blend-screen"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 18px), radial-gradient(circle at 50% 8%, ${accentColor}40, transparent 38%)`,
        }}
      />
      <div
        className="absolute inset-x-5 top-5 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-16 bg-gradient-to-b from-transparent to-[#08090f]" />
    </div>
  );
});
