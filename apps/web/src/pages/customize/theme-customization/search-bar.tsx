/**
 * SearchBar component for theme filtering
 */

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 */
/**
 * Search Bar component.
 */
export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative group">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search themes..."
        className="aurora-social-search peer w-full rounded-xl py-3 pl-11 pr-4 text-sm text-white backdrop-blur-2xl transition-all duration-300 focus:outline-none"
      />
      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-primary-500/8 via-violet-500/6 to-primary-400/8 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
      <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-all duration-300 peer-focus:text-primary-300" />
    </div>
  );
}
