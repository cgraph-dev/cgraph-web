import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type GlassSearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * GlassSearchInput v4.2 (1:1 Discover Parity)
 * Matches the 'Social/Discovery' (DiscoverTab) architecture exactly.
 */
export const GlassSearchInput = ({ className = '', ...props }: GlassSearchInputProps) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        {...props}
        className="themed-search-input peer w-full rounded-2xl py-3.5 pl-12 pr-4 text-sm backdrop-blur-xl transition-all duration-200 focus:outline-none"
      />
      <MagnifyingGlassIcon className="themed-search-icon pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-all duration-200" />
    </div>
  );
};
