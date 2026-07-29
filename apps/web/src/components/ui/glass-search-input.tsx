import React from 'react';
import { Search } from 'lucide-react';

type GlassSearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Search field using the product input contract. */
export const GlassSearchInput = ({ className = '', ...props }: GlassSearchInputProps) => {
  return (
    <div className={`cgraph-search-field relative ${className}`}>
      <input
        type="text"
        {...props}
        className="cgraph-field w-full pl-10 pr-4 text-sm"
      />
      <Search
        aria-hidden="true"
        className="cgraph-search-icon pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
      />
    </div>
  );
};
