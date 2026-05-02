/**
 * AnimatedAvatar types
 */

export interface AnimatedAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallbackText?: string;
  className?: string;
  onClick?: () => void;
  showStatus?: boolean;
  statusType?: 'online' | 'idle' | 'dnd' | 'offline';
  level?: number;
  isPremium?: boolean;
  isVerified?: boolean;
  title?: { name: string; color: string };
}
