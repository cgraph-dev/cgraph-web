import { memo, useMemo } from 'react';

import { cn } from '@/lib/utils';
import { AVATAR_BORDERS } from '@/data/avatar-borders';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';

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
}: AvatarZoneProps) {
  const borderConfig = useMemo(
    () => (avatarBorderId ? AVATAR_BORDERS.find((b) => b.id === avatarBorderId) : undefined),
    [avatarBorderId]
  );

  return (
    <div className="relative z-[6] -mt-[60px] flex justify-center">
      <div className="relative h-[86px] w-[86px]">
        {/* Ambient halo glow behind avatar */}
        <div
          className="pointer-events-none absolute -inset-[18px] z-0 rounded-full"
          style={{
            background: `radial-gradient(circle, color-mix(in srgb, ${accentColor} 12%, transparent) 0%, transparent 70%)`,
            animation: 'pc-halo-pulse 3.5s ease-in-out infinite',
          }}
        />

        {/* Energy ring SVG (hidden when Lottie border is active) */}
        {!borderConfig && <RingForTier tier={energyRingTier} />}

        {/* Avatar circle — Lottie border or plain */}
        {borderConfig ? (
          <div className="absolute inset-0 z-[2] flex items-center justify-center">
            <AvatarBorderRenderer
              src={avatarUrl || undefined}
              alt={displayName}
              border={borderConfig}
              size={120}
              animationSpeed={1}
              interactive={false}
            >
              {!avatarUrl && (
                <span
                  className="flex h-full w-full items-center justify-center text-[1.2rem] font-black text-[#edf0f8]"
                  style={{ fontFamily: "'Inter', system-ui" }}
                >
                  {initials}
                </span>
              )}
            </AvatarBorderRenderer>
          </div>
        ) : (
          <div
            className="relative z-[2] flex h-[86px] w-[86px] items-center justify-center overflow-hidden rounded-full border-2 border-white/[0.07]"
            style={{
              background: 'linear-gradient(145deg, #0c0f18, #080b14)',
              boxShadow:
                'inset 0 1.5px 0 rgba(255,255,255,0.11), inset 0 -1px 0 rgba(0,0,0,0.4), 0 0 0 1.5px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span
                className="text-[1.45rem] font-black text-[#edf0f8]"
                style={{ fontFamily: "'Inter', system-ui" }}
              >
                {initials}
              </span>
            )}
          </div>
        )}

        {/* Status dot */}
        <div
          className={cn(
            'absolute bottom-1 right-1 z-[3] h-3.5 w-3.5 rounded-full border-[2.5px] border-[#08090f]',
            isOnline ? 'bg-[#1ad870]' : 'bg-[#222c3c]'
          )}
          style={isOnline ? { animation: 'pc-status-pulse 2.4s ease-in-out infinite' } : undefined}
        />
      </div>
    </div>
  );
});
