/**
 * Password visibility toggle button with eye icon.
 *
 */

import { Eye, EyeOff } from 'lucide-react';

interface PasswordToggleButtonProps {
  show: boolean;
  onToggle: () => void;
}

/**
 */
/**
 * Password Toggle Button component.
 */
export function PasswordToggleButton({ show, onToggle }: PasswordToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? 'Hide password' : 'Show password'}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition-colors hover:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
    </button>
  );
}
