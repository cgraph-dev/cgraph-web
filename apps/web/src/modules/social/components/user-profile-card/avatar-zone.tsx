import { memo, useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import { getBorderById } from '@/data/avatar-borders';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';
import { resolveAvatarUrl } from '@/lib/media-url';

import type { AvatarZoneProps, BadgeDisplayTier } from './types';
function LegendaryRing(): React.ReactElement {
  return (
    <svg
      className="pointer-events-none absolute -inset-[13px] z-[1] h-[calc(100%+26px)] w-[calc(100%+26px)]"
      viewBox="0 0 112 112"
      fill="none"
      style={{ animation: 'pc-ring-spin 10s linear infinite' }}
    >
      <defs>
        <linearGradient id="pc-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8a020" />
          <stop offset="30%" stopColor="#c47dff" />
          <stop offset="65%" stopColor="#00d4aa" />
          <stop offset="100%" stopColor="#e8a020" />
        </linearGradient>
        <filter id="pc-ring-blur">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      {/* Soft glow halo ring */}
      <circle
        cx={56}
        cy={56}
        r={52}
        stroke="url(#pc-ring-grad)"
        strokeWidth={3}
        opacity={0.18}
        filter="url(#pc-ring-blur)"
      />
      {/* Main energy ring with varied dash pattern */}
      <circle
        cx={56}
        cy={56}
        r={50}
        stroke="url(#pc-ring-grad)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeDasharray="22 7 6 3 14 10 4 18"
      />
      {/* Fine inner arc */}
      <circle
        cx={56}
        cy={56}
        r={46}
        stroke="url(#pc-ring-grad)"
        strokeWidth={0.8}
        opacity={0.3}
        strokeDasharray="70 250"
        strokeDashoffset={40}
      />
    </svg>
  );
}

function DefaultRing(): React.ReactElement {
  return (
    <svg
      className="pointer-events-none absolute -inset-[13px] z-[1] h-[calc(100%+26px)] w-[calc(100%+26px)] opacity-[0.07]"
      viewBox="0 0 112 112"
      fill="none"
      style={{ animation: 'pc-ring-spin 50s linear infinite' }}
    >
      <circle cx={56} cy={56} r={50} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
    </svg>
  );
}

function RingForTier({ tier }: { tier: BadgeDisplayTier }): React.ReactElement {
  if (tier === 'legendary') return <LegendaryRing />;
  return <DefaultRing />;
}
export const AvatarZone = memo(function AvatarZone({
  avatarUrl,
  displayName,
  initials,
  isOnline,
  energyRingTier,
  accentColor,
  avatarBorderId,
  variant = 'full',
}: AvatarZoneProps) {
  const borderConfig = useMemo(
    () => (avatarBorderId ? getBorderById(avatarBorderId) : undefined),
    [avatarBorderId]
  );
  const isMini = variant === 'mini';
  const avatarSize = isMini ? 82 : 98;
  const borderSize = isMini ? 116 : 134;
  const frameSize = borderConfig ? borderSize : avatarSize;
  const initialsSize = isMini ? '1.35rem' : '1.55rem';
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const normalizedAvatarUrl = resolveAvatarUrl(avatarUrl);
  const canRenderAvatar = Boolean(normalizedAvatarUrl) && !avatarImageFailed;

  useEffect(() => {
    setAvatarImageFailed(false);
  }, [normalizedAvatarUrl]);

  const fallbackAvatar = (
    <span
      className="flex h-full w-full items-center justify-center font-black text-[#edf0f8]"
      style={{ fontFamily: "'Inter', system-ui", fontSize: initialsSize }}
    >
      {initials}
    </span>
  );

  return (
    <div
      className={cn('relative z-[6] flex justify-center', isMini ? '-mt-[58px]' : '-mt-[70px]')}
      data-avatar-border-id={avatarBorderId}
      data-avatar-zone-variant={variant}
      data-avatar-size={avatarSize}
      data-avatar-frame-size={frameSize}
    >
      <div className="relative overflow-visible" style={{ width: frameSize, height: frameSize }}>
        {/* Ambient halo glow behind avatar */}
        <div
          className="pointer-events-none absolute z-0 rounded-full"
          style={{
            inset: isMini ? -16 : -20,
            background: `radial-gradient(circle, color-mix(in srgb, ${accentColor} 14%, transparent) 0%, transparent 70%)`,
            animation: 'pc-halo-pulse 3.5s ease-in-out infinite',
          }}
        />
        <div
          className="pointer-events-none absolute z-[1] rounded-full border border-white/[0.06]"
          style={{
            inset: isMini ? -7 : -9,
            boxShadow: `0 0 26px color-mix(in srgb, ${accentColor} 16%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        />

        {/* Energy ring SVG (hidden when Lottie border is active) */}
        {!borderConfig && <RingForTier tier={energyRingTier} />}

        {/* Avatar circle — Lottie border or plain */}
        {borderConfig ? (
          <div className="relative z-[2] flex h-full w-full items-center justify-center">
            <AvatarBorderRenderer
              src={canRenderAvatar ? normalizedAvatarUrl || undefined : undefined}
              alt={displayName}
              border={borderConfig}
              size={borderSize}
              animationSpeed={1}
              interactive={false}
              fallback={fallbackAvatar}
            >
              {!canRenderAvatar ? fallbackAvatar : undefined}
            </AvatarBorderRenderer>
          </div>
        ) : (
          <div
            className="relative z-[2] flex items-center justify-center overflow-hidden rounded-full border-2 border-white/[0.07]"
            style={{
              width: avatarSize,
              height: avatarSize,
              background: 'linear-gradient(145deg, #0c0f18, #080b14)',
              boxShadow:
                'inset 0 1.5px 0 rgba(255,255,255,0.11), inset 0 -1px 0 rgba(0,0,0,0.4), 0 0 0 1.5px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            {canRenderAvatar ? (
              <img
                src={normalizedAvatarUrl || undefined}
                alt={displayName}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={() => setAvatarImageFailed(true)}
              />
            ) : (
              fallbackAvatar
            )}
          </div>
        )}

        {/* Status dot */}
        <div
          className={cn(
            'absolute z-[3] rounded-full border-[#08090f]',
            isOnline ? 'bg-[#1ad870]' : 'bg-[#222c3c]'
          )}
          style={{
            bottom: isMini ? 2 : 3,
            right: isMini ? 2 : 3,
            width: isMini ? 14 : 16,
            height: isMini ? 14 : 16,
            borderWidth: isMini ? 2.5 : 3,
            ...(isOnline ? { animation: 'pc-status-pulse 2.4s ease-in-out infinite' } : {}),
          }}
        />
      </div>
    </div>
  );
});
