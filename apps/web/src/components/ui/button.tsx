import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useMotionSafe } from '@/hooks/useMotionSafe';
import { cn } from '@/lib/utils';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'glass';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly isLoading?: boolean;
  readonly leftIcon?: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
  readonly fullWidth?: boolean;
  readonly animated?: boolean;
  readonly children?: React.ReactNode;
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
  type = 'button',
  className = '',
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const { tapScale } = useMotionSafe();

  const baseStyles =
    'cgraph-control inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<typeof variant, string> = {
    primary: 'cgraph-control-primary',
    secondary: 'cgraph-control-secondary',
    outline: 'cgraph-control-outline',
    ghost: 'cgraph-control-ghost',
    danger: 'cgraph-control-danger',
    success: 'cgraph-control-success',
    glass: 'cgraph-control-glass',
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
      type={type}
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
      {leftIcon && !isLoading && (
        <span
          className="flex-shrink-0 text-current [&_svg]:h-[1.1em] [&_svg]:w-[1.1em] [&_svg]:stroke-current [&_svg]:text-current"
        >
          {leftIcon}
        </span>
      )}
      {isLoading && <LoadingSpinner size={size} />}
      <span className={isLoading ? 'opacity-80' : undefined}>{children}</span>
      {rightIcon && !isLoading && (
        <span
          className="flex-shrink-0 text-current [&_svg]:h-[1.1em] [&_svg]:w-[1.1em] [&_svg]:stroke-current [&_svg]:text-current"
        >
          {rightIcon}
        </span>
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
    <LoaderCircle
      className={cn('animate-spin', SPINNER_SIZE_CLASSES[size], className)}
      aria-hidden="true"
    />
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
  type = 'button',
  className = '',
  ref,
  ...props
}: IconButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const { tapScale } = useMotionSafe();

  const baseStyles =
    'cgraph-control cgraph-control-icon inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<typeof variant, string> = {
    primary: 'cgraph-control-primary',
    secondary: 'cgraph-control-secondary',
    ghost: 'cgraph-control-ghost',
    danger: 'cgraph-control-danger',
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
      type={type}
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
