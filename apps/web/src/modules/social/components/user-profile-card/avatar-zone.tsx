import { memo, useEffect, useMemo, useState } from 'react';
import {
  getProfileRenderingAnchorOrDefault,
  type ProfileRenderingSurfaceId,
} from '@cgraph-dev/shared-types';

import { cn } from '@/lib/utils';
import { getBorderById } from '@/data/avatar-borders';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';
import { resolveAvatarUrl } from '@/lib/media-url';

import type { AvatarZoneProps, BadgeDisplayTier } from './types';

const PROFILE_SURFACE_BY_VARIANT = {
  mini: 'mini-card',
  full: 'full-profile',
} as const satisfies Record<NonNullable<AvatarZoneProps['variant']>, ProfileRenderingSurfaceId>;

function getAvatarLayout(variant: NonNullable<AvatarZoneProps['variant']>) {
  return getProfileRenderingAnchorOrDefault(PROFILE_SURFACE_BY_VARIANT[variant]).avatar;
}

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
  const layout = getAvatarLayout(variant);
  const avatarSize = layout.avatarSize;
  const frameSize = layout.frameSize;
  const avatarScale = avatarSize / frameSize;
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
      className="relative z-[6] flex justify-center"
      data-avatar-border-id={avatarBorderId}
      data-avatar-zone-variant={variant}
      data-avatar-size={avatarSize}
      data-avatar-frame-size={frameSize}
      data-avatar-layout-anchor="fixed"
      data-avatar-anchor-y={layout.anchorY}
      style={{ height: frameSize, marginTop: layout.overlap }}
    >
      <div
        className="relative overflow-visible"
        data-avatar-slot="true"
        data-avatar-slot-size={frameSize}
        data-avatar-container-size={avatarSize}
        style={{ width: frameSize, height: frameSize }}
      >
        {!borderConfig && (
          <>
            {/* Ambient halo glow behind plain avatars only. Image frames carry their own art. */}
            <div
              className="pointer-events-none absolute z-0 rounded-full"
              style={{
                inset: isMini ? 2 : 0,
                background: `radial-gradient(circle, color-mix(in srgb, ${accentColor} 14%, transparent) 0%, transparent 70%)`,
                animation: 'pc-halo-pulse 3.5s ease-in-out infinite',
              }}
            />
            <div
              className="pointer-events-none absolute z-[1] rounded-full border border-white/[0.06]"
              style={{
                inset: isMini ? 12 : 14,
                boxShadow: `0 0 26px color-mix(in srgb, ${accentColor} 16%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)`,
              }}
            />
          </>
        )}

        {/* Energy ring SVG (hidden when Lottie border is active) */}
        {!borderConfig && (
          <div
            className="absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2"
            style={{ width: avatarSize, height: avatarSize }}
          >
            <RingForTier tier={energyRingTier} />
          </div>
        )}

        {/* Avatar circle — Lottie border or plain */}
        {borderConfig ? (
          <div
            className="absolute left-1/2 top-1/2 z-[2] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ width: frameSize, height: frameSize }}
          >
            <AvatarBorderRenderer
              src={canRenderAvatar ? normalizedAvatarUrl || undefined : undefined}
              alt={displayName}
              border={borderConfig}
              size={frameSize}
              avatarScale={avatarScale}
              animationSpeed={1}
              interactive={false}
              fallback={fallbackAvatar}
            >
              {!canRenderAvatar ? fallbackAvatar : undefined}
            </AvatarBorderRenderer>
          </div>
        ) : (
          <div
            className="absolute left-1/2 top-1/2 z-[2] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-2 border-white/[0.07]"
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
          data-avatar-status-dot="true"
          data-status-attached-to={layout.statusAttachedTo}
          style={{
            left: `calc(50% + ${
              avatarSize / 2 - layout.statusSize * layout.statusOffsetXFactor
            }px)`,
            top: `calc(50% + ${avatarSize * layout.statusOffsetYFactor}px)`,
            width: layout.statusSize,
            height: layout.statusSize,
            borderWidth: layout.statusBorderWidth,
            transform: 'translate(-50%, -50%)',
            ...(isOnline ? { animation: 'pc-status-pulse 2.4s ease-in-out infinite' } : {}),
          }}
        />
      </div>
    </div>
  );
});
