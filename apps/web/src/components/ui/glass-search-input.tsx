import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type GlassSearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Search field using the product input contract. */
export const GlassSearchInput = ({ className = '', ...props }: GlassSearchInputProps) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        {...props}
        className="cgraph-field peer w-full pl-10 pr-4 text-sm"
      />
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--token-text-muted)] transition-colors peer-focus:text-[var(--token-interactive-primary)]" />
    </div>
  );
};
