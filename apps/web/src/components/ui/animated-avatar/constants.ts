/**
 * AnimatedAvatar constants
 */

/** Size configuration for avatar rendering */
export const SIZE_CONFIG: Record<
  string,
  { container: string; text: string; badge: string; levelSize: string }
> = {
  xs: { container: 'h-6 w-6', text: '10px', badge: 'h-2 w-2', levelSize: '6px' },
  sm: { container: 'h-8 w-8', text: '12px', badge: 'h-2.5 w-2.5', levelSize: '7px' },
  md: { container: 'h-10 w-10', text: '14px', badge: 'h-3 w-3', levelSize: '8px' },
  lg: { container: 'h-14 w-14', text: '18px', badge: 'h-3.5 w-3.5', levelSize: '9px' },
  xl: { container: 'h-20 w-20', text: '24px', badge: 'h-4 w-4', levelSize: '10px' },
  '2xl': { container: 'h-28 w-28', text: '32px', badge: 'h-5 w-5', levelSize: '12px' },
};

/** Status indicator colors */
export const STATUS_COLORS: Record<string, { bg: string; glow: string }> = {
  online: { bg: 'bg-green-500', glow: 'rgba(34,197,94,0.4)' },
  idle: { bg: 'bg-yellow-500', glow: 'rgba(234,179,8,0.3)' },
  dnd: { bg: 'bg-red-500', glow: 'rgba(239,68,68,0.3)' },
  offline: { bg: 'bg-gray-500', glow: 'transparent' },
};
