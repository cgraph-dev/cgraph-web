/**
 * AnimatedToggle Component
 *
 * Toggle switch with gradient background, smooth animations,
 * and theme-aware styling.
 */

import { motion } from 'motion/react';

interface AnimatedToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
}

const sizeConfig = {
  sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 16, text: 'text-xs' },
  md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 20, text: 'text-sm' },
  lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 28, text: 'text-base' },
};

/**
 * Animated Toggle component.
 */
export default function AnimatedToggle({
  label,
  description,
  checked,
  onChange,
  color = '#10b981',
  disabled = false,
  size = 'md',
  className = '',
  icon,
}: AnimatedToggleProps) {
  const config = sizeConfig[size];
  void color;

  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className} `}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {icon && <span className="flex-shrink-0 text-white/40">{icon}</span>}
        <div className="min-w-0">
          <span className={`font-medium text-white ${config.text}`}>{label}</span>
          {description && <p className="truncate text-xs text-white/40">{description}</p>}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        data-checked={checked}
        className={`aurora-social-toggle relative flex-shrink-0 ${size === 'sm' ? 'aurora-social-toggle--compact' : size === 'lg' ? 'aurora-social-toggle--large' : ''} ${config.track} rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900`}
      >
        <motion.span
          className={`aurora-social-toggle-thumb absolute left-0.5 top-0.5 ${config.thumb} rounded-full`}
          whileTap={{ scale: 0.9 }}
        />
      </button>
    </label>
  );
}

/**
 * Toggle group for related options
 */
export function ToggleGroup({
  children,
  title,
  className = '',
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h4 className="text-sm font-medium uppercase tracking-wider text-white/40">{title}</h4>
      )}
      <div className="aurora-social-panel space-y-2 rounded-2xl p-4">{children}</div>
    </div>
  );
}

/**
 * Compact toggle for inline use
 */
export function CompactToggle({
  checked,
  onChange,
  color = '#10b981',
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string;
  disabled?: boolean;
}) {
  void color;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      data-checked={checked}
      className={`aurora-social-toggle aurora-social-toggle--compact relative h-5 w-9 rounded-full ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} `}
    >
      <motion.span className="aurora-social-toggle-thumb absolute left-0.5 top-0.5 h-4 w-4 rounded-full" />
    </button>
  );
}
