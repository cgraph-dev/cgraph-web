/**
 * Alert Component
 *
 * Display important messages to users.
 */

import { ReactNode } from 'react';

type AlertVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'destructive';

interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  default: 'bg-surface border-surfaceBorder text-textPrimary',
  success: 'bg-success/10 border-success/30 text-success',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  error: 'bg-error/10 border-error/30 text-error',
  info: 'bg-info/10 border-info/30 text-info',
  destructive: 'bg-error/10 border-error/30 text-error',
};

/**
 */
/**
 * Alert component.
 */
export function Alert({ children, variant = 'default', className = '' }: AlertProps) {
  return (
    <div role="alert" className={`rounded-lg border p-4 ${variantStyles[variant]} ${className} `}>
      {children}
    </div>
  );
}

interface AlertDescriptionProps {
  children: ReactNode;
  className?: string;
}

/**
 */
/**
 * Alert Description component.
 */
export function AlertDescription({ children, className = '' }: AlertDescriptionProps) {
  return <div className={`text-sm ${className}`}>{children}</div>;
}

interface AlertTitleProps {
  children: ReactNode;
  className?: string;
}

/**
 */
/**
 * Alert Title component.
 */
export function AlertTitle({ children, className = '' }: AlertTitleProps) {
  return <h4 className={`mb-1 font-medium ${className}`}>{children}</h4>;
}

export default Alert;
