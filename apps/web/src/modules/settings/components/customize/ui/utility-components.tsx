/**
 * Utility components for customization UI
 */

import { memo } from 'react';

import { AnimatedToggle } from './animated-toggle';
import { premiumConfig } from './constants';
import type { SectionHeaderProps, ToggleRowProps, PremiumBadgeProps } from './types';

export const SectionHeader = memo(function SectionHeader({
  title,
  subtitle,
  icon,
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary-500/16 bg-primary-500/10 text-primary-300">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-[var(--token-text-primary)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--token-text-muted)]">{subtitle}</p>}
      </div>
    </div>
  );
});

export const ToggleRow = memo(function ToggleRow({
  label,
  description,
  icon,
  enabled,
  onToggle,
  colorPreset = 'emerald',
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {icon && <span className="text-lg">{icon}</span>}
        <div>
          <span className="text-sm font-medium text-[var(--token-text-primary)]">{label}</span>
          {description && <p className="text-xs text-[var(--token-text-muted)]">{description}</p>}
        </div>
      </div>
      <AnimatedToggle enabled={enabled} onToggle={onToggle} colorPreset={colorPreset} />
    </div>
  );
});

export const PremiumBadge = memo(function PremiumBadge({
  tier = 'premium',
  className = '',
}: PremiumBadgeProps) {
  const { label, bg, text } = premiumConfig[tier];

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${bg} ${text} ${className}`}
    >
      {label}
    </span>
  );
});
