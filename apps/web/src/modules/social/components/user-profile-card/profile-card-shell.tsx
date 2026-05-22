import { memo } from 'react';

import { cn } from '@/lib/utils';

import type { CardShellProps } from './types';

import './profile-card.css';

/**
 * CardShell — outermost wrapper providing the gradient border + outer glow.
 * Uses a 1px padding trick: the outer div has the gradient background,
 * the inner div clips over it with the solid card background color,
 * leaving a 1px gradient border visible around the edges.
 */
export const CardShell = memo(function CardShell({
  children,
  accentColor,
  className,
  profileThemeId,
}: CardShellProps) {
  return (
    <div
      className={cn('relative rounded-[22px] p-px', className)}
      data-profile-theme-id={profileThemeId}
      style={{
        background: `linear-gradient(148deg, color-mix(in srgb, ${accentColor} 52%, transparent) 0%, color-mix(in srgb, ${accentColor} 10%, transparent) 28%, rgba(255,255,255,0.04) 52%, transparent 100%)`,
        boxShadow: `0 0 0 1px rgba(0,0,0,0.6), 0 12px 40px rgba(0,0,0,0.55), 0 0 70px color-mix(in srgb, ${accentColor} 7%, transparent)`,
      }}
    >
      <div className="w-full rounded-[21px] bg-[#08090f]">{children}</div>
    </div>
  );
});
