import type { ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardSectionProps {
  children: ReactNode;
  className?: string;
}

interface CardTitleProps extends CardSectionProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

const PADDING_CLASSES: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export default function Card({
  children,
  className = '',
  padding = 'md',
}: CardProps): ReactElement {
  return (
    <div
      data-cgraph-material="solid"
      data-cgraph-surface="card"
      className={cn('cgraph-card', PADDING_CLASSES[padding], className)}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardSectionProps): ReactElement {
  return (
    <div className={cn('mb-3 border-b border-[var(--token-card-border)] pb-3', className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
  as: Tag = 'h3',
}: CardTitleProps): ReactElement {
  return (
    <Tag className={cn('font-semibold text-[var(--token-text-primary)]', className)}>
      {children}
    </Tag>
  );
}

export function CardContent({ children, className = '' }: CardSectionProps): ReactElement {
  return <div className={cn('text-[var(--token-text-secondary)]', className)}>{children}</div>;
}

export function CardDescription({ children, className = '' }: CardSectionProps): ReactElement {
  return <p className={cn('text-sm text-[var(--token-text-muted)]', className)}>{children}</p>;
}
