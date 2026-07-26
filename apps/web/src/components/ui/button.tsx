import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useMotionSafe } from '@/hooks/useMotionSafe';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'glass';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly isLoading?: boolean;
  readonly leftIcon?: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
  readonly fullWidth?: boolean;
  readonly animated?: boolean;
}
/** Button. */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  animated = true,
  disabled,
  children,
  className = '',
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const { tapScale } = useMotionSafe();

  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-[background-color,border-color,box-shadow,color,opacity] duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<typeof variant, string> = {
    primary:
      'bg-[var(--token-interactive-primary)] text-[var(--token-text-on-primary)] shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:bg-[var(--token-interactive-hover)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl border border-[var(--token-border-muted)]',
    secondary:
      'bg-[var(--token-bg-secondary)] text-[var(--token-text-primary)] hover:bg-[var(--token-bg-tertiary)] border border-[var(--token-border-muted)] hover:border-[var(--token-card-border)] backdrop-blur-lg',
    outline:
      'border border-[var(--token-card-border)] text-[var(--token-text-primary)] hover:bg-[var(--token-bg-secondary)] hover:border-[var(--token-interactive-primary)] focus:ring-[var(--token-interactive-primary)] backdrop-blur-md',
    ghost:
      'text-[var(--token-text-secondary)] hover:bg-[var(--token-bg-secondary)] hover:text-[var(--token-text-primary)] focus:ring-[var(--token-interactive-primary)] backdrop-blur-sm',
    danger:
      'bg-red-950/20 text-red-100 hover:bg-red-900/30 shadow-[0_4px_16px_rgba(0,0,0,0.4),rgba(239,68,68,0.1)_0px_0px_20px_inset] border border-red-500/20 backdrop-blur-xl hover:border-red-400/40',
    success:
      'bg-[color-mix(in_srgb,var(--color-brand-purple)_8%,transparent)] text-[var(--color-brand-purple)] hover:bg-[color-mix(in_srgb,var(--color-brand-purple)_14%,transparent)] shadow-[0_4px_16px_rgba(0,0,0,0.4),color-mix(in_srgb,var(--color-brand-purple)_10%,transparent)_0px_0px_20px_inset] border border-[color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)] backdrop-blur-xl hover:border-[color-mix(in_srgb,var(--color-brand-purple)_40%,transparent)]',
    glass:
      'bg-[var(--token-bg-secondary)] border border-[var(--token-border-muted)] hover:bg-[var(--token-bg-tertiary)] hover:border-[var(--token-card-border)] text-[var(--token-text-primary)] backdrop-blur-2xl',
  };

  const sizeStyles: Record<typeof size, string> = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };
  const motionProps = animated
    ? {
        whileTap: tapScale(),
        transition: { type: 'spring' as const, stiffness: 400, damping: 25, mass: 0.8 },
      }
    : {};

  return (
    <motion.button
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      data-cgraph-material={
        variant === 'glass' ? 'glass' : variant === 'ghost' ? 'solid' : 'control'
      }
      data-cgraph-surface="control"
      data-cgraph-state={disabled || isLoading ? 'disabled' : 'idle'}
      data-cgraph-variant={variant}
      className={` ${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className} `}
      {...motionProps}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={size} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="flex-shrink-0 text-current [&_svg]:h-[1.1em] [&_svg]:w-[1.1em] [&_svg]:stroke-current [&_svg]:text-current">
              {leftIcon}
            </span>
          )}
          {children}
          {rightIcon && (
            <span className="flex-shrink-0 text-current [&_svg]:h-[1.1em] [&_svg]:w-[1.1em] [&_svg]:stroke-current [&_svg]:text-current">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </motion.button>
  );
}

const SPINNER_SIZE_CLASSES = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  icon: 'w-5 h-5',
} as const;

interface LoadingSpinnerProps {
  readonly size: keyof typeof SPINNER_SIZE_CLASSES;
  readonly className?: string;
}

function LoadingSpinner({ size, className = '' }: LoadingSpinnerProps): React.ReactElement {
  return (
    <svg
      className={`animate-spin ${SPINNER_SIZE_CLASSES[size]} ${className}`}
      fill="none"
      aria-hidden="true"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  readonly icon: React.ReactNode;
  readonly variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly label: string;
  readonly isLoading?: boolean;
}
/** Icon Button. */
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  label,
  isLoading = false,
  disabled,
  className = '',
  ref,
  ...props
}: IconButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const { tapScale } = useMotionSafe();

  const baseStyles =
    'inline-flex items-center justify-center rounded-lg transition-[background-color,border-color,box-shadow,color,opacity] duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<typeof variant, string> = {
    primary:
      'bg-[var(--token-interactive-primary)] text-[var(--token-text-on-primary)] shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:bg-[var(--token-interactive-hover)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl border border-[var(--token-border-muted)]',
    secondary:
      'bg-[var(--token-bg-secondary)] text-[var(--token-text-primary)] hover:bg-[var(--token-bg-tertiary)] border border-[var(--token-border-muted)] hover:border-[var(--token-card-border)] backdrop-blur-lg shadow-[rgba(255,255,255,0.03)_0px_1px_1px_inset]',
    ghost:
      'text-[var(--token-text-secondary)] hover:bg-[var(--token-bg-secondary)] hover:text-[var(--token-text-primary)] focus:ring-[var(--token-interactive-primary)] backdrop-blur-sm',
    danger:
      'bg-transparent text-red-500/80 hover:bg-red-950/20 hover:text-red-400 focus:ring-red-500 border border-transparent hover:border-red-500/20 backdrop-blur-sm hover:shadow-[rgba(239,68,68,0.1)_0px_0px_15px_inset]',
  };

  const sizeStyles: Record<typeof size, string> = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes: Record<typeof size, string> = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <motion.button
      ref={ref}
      disabled={disabled || isLoading}
      aria-label={label}
      title={label}
      aria-busy={isLoading || undefined}
      data-cgraph-material={variant === 'ghost' ? 'solid' : variant === 'secondary' ? 'recessed' : 'control'}
      data-cgraph-surface="control"
      data-cgraph-state={disabled || isLoading ? 'disabled' : 'idle'}
      data-cgraph-variant={variant}
      className={` ${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} `}
      whileTap={tapScale()}
      transition={{ type: 'spring', stiffness: 500, damping: 25, mass: 0.8 }}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="icon" className={iconSizes[size]} />
      ) : (
        <span
          className={`${iconSizes[size]} text-current [&_svg]:h-full [&_svg]:w-full [&_svg]:stroke-current [&_svg]:text-current`}
        >
          {icon}
        </span>
      )}
    </motion.button>
  );
}
export default Button;
