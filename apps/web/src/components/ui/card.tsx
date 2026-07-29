/** Card — reusable card container with variant, padding, and animation options. */
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'interactive' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animate?: boolean;
}

/**
 * Card - A reusable card component with consistent styling.
 *
 * Variants:
 * - default: Basic card with border
 * - interactive: Adds hover effects for clickable cards
 * - elevated: More prominent shadow
 */
export default function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  animate = false,
}: CardProps) {
  const baseStyles = 'cgraph-card';

  const variantStyles = {
    default: '',
    interactive:
      'hover:bg-[var(--token-card-bg)] hover:shadow-card-hover transition-[background-color,border-color,box-shadow,color] duration-200 cursor-pointer',
    elevated: 'shadow-card',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const animateStyles = animate ? 'animate-fade-in-up' : '';

  return (
    <div
      data-cgraph-material={variant === 'elevated' ? 'floating' : variant === 'interactive' ? 'recessed' : 'solid'}
      data-cgraph-surface="card"
      data-cgraph-state={variant === 'interactive' ? 'idle' : undefined}
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${animateStyles} ${className}`}
    >
      {children}
    </div>
  );
}

// Card Header component
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 */
/**
 * Card Header display component.
 */
export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`mb-3 border-b border-[var(--token-card-border)] pb-3 ${className}`}>{children}</div>;
}

// Card Title component
interface CardTitleProps {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

/**
 */
/**
 * Card Title display component.
 */
export function CardTitle({ children, className = '', as: Tag = 'h3' }: CardTitleProps) {
  return <Tag className={`font-semibold text-[var(--token-text-primary)] ${className}`}>{children}</Tag>;
}

// Card Content component
interface CardContentProps {
  children: ReactNode;
  className?: string;
}

/**
 */
/**
 * Card Content display component.
 */
export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`text-[var(--token-text-secondary)] ${className}`}>{children}</div>;
}

// Card Footer component
interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 */
/**
 * Card Footer display component.
 */
export function CardFooter({ children, className = '' }: CardFooterProps) {
  return <div className={`mt-3 border-t border-[var(--token-card-border)] pt-3 ${className}`}>{children}</div>;
}

// Card Description component
interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

/**
 */
/**
 * Card Description display component.
 */
export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return <p className={`text-sm text-[var(--token-text-muted)] ${className}`}>{children}</p>;
}
