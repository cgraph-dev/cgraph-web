import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { LottieBorderRenderer } from '@/lib/lottie/lottie-border-renderer';
import { LottieRenderer } from '@/lib/lottie/lottie-renderer';
import { getBorderById } from '@/data/avatar-borders';
import { getAvatarBorderStyle } from './avatar-border-style';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
type AvatarStatus = 'online' | 'offline' | 'idle' | 'dnd' | 'invisible';
type AvatarShape = 'circle' | 'square';

interface AvatarProps {
  readonly src?: string | null;
  readonly alt?: string;
  readonly name?: string;
  readonly size?: AvatarSize;
  readonly className?: string;
  readonly badge?: ReactNode;
  readonly status?: AvatarStatus;
  readonly storyRing?: boolean;
  readonly typing?: boolean;
  readonly shape?: AvatarShape;
  readonly borderId?: string | null;
  readonly lottieUrl?: string;
}

const sizeConfig: Record<
  AvatarSize,
  { px: number; container: string; text: string; statusDot: string; statusRing: string }
> = {
  xs: {
    px: 16,
    container: 'h-4 w-4',
    text: 'text-[7px]',
    statusDot: 'h-1.5 w-1.5',
    statusRing: 'ring-1',
  },
  sm: {
    px: 24,
    container: 'h-6 w-6',
    text: 'text-[9px]',
    statusDot: 'h-2 w-2',
    statusRing: 'ring-[1.5px]',
  },
  md: {
    px: 32,
    container: 'h-8 w-8',
    text: 'text-[11px]',
    statusDot: 'h-2.5 w-2.5',
    statusRing: 'ring-2',
  },
  lg: {
    px: 40,
    container: 'h-10 w-10',
    text: 'text-xs',
    statusDot: 'h-3 w-3',
    statusRing: 'ring-2',
  },
  xl: {
    px: 56,
    container: 'h-14 w-14',
    text: 'text-base',
    statusDot: 'h-3.5 w-3.5',
    statusRing: 'ring-2',
  },
  '2xl': {
    px: 80,
    container: 'h-20 w-20',
    text: 'text-xl',
    statusDot: 'h-4 w-4',
    statusRing: 'ring-[3px]',
  },
  '3xl': {
    px: 120,
    container: 'h-[120px] w-[120px]',
    text: 'text-3xl',
    statusDot: 'h-5 w-5',
    statusRing: 'ring-[3px]',
  },
};

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  idle: 'bg-yellow-500',
  dnd: 'bg-red-500',
  invisible: 'bg-gray-500',
};

const GRADIENT_PALETTE = [
  'from-red-500 to-orange-500',
  'from-orange-500 to-amber-500',
  'from-amber-500 to-yellow-500',
  'from-green-500 to-emerald-500',
  'from-teal-500 to-cyan-500',
  'from-cyan-500 to-blue-500',
  'from-blue-500 to-indigo-500',
  'from-indigo-500 to-violet-500',
  'from-violet-500 to-purple-500',
  'from-purple-500 to-fuchsia-500',
  'from-fuchsia-500 to-pink-500',
  'from-pink-500 to-rose-500',
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getGradient(name: string): string {
  return GRADIENT_PALETTE[hashName(name) % GRADIENT_PALETTE.length]!;
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name
    .trim()
    .split(' ')
    .filter((p) => p.length > 0);
  if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

/** Avatar. */
export default function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
  badge,
  status,
  storyRing = false,
  typing = false,
  shape = 'circle',
  borderId,
  lottieUrl,
}: AvatarProps) {
  const cfg = sizeConfig[size];
  const rounding = shape === 'square' ? 'rounded-2xl' : 'rounded-full';
  const gradient = getGradient(name);
  const borderStyle = borderId ? getAvatarBorderStyle(borderId) : { className: '' };
  const border = borderId ? getBorderById(borderId) : undefined;
  const borderImageUrl = border?.imageUrl ?? border?.previewUrl;
  const borderLottieUrl = border?.lottieUrl ?? undefined;

  const avatarContent = (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {/* Story ring */}
      {storyRing && (
        <div
          className={cn(
            'absolute -inset-[3px] animate-[spin_4s_linear_infinite] bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500',
            rounding
          )}
        />
      )}

      {/* Avatar image / initials */}
      <div
        className={cn(
          cfg.container,
          'relative flex items-center justify-center overflow-hidden',
          rounding,
          storyRing && 'ring-2 ring-[rgb(15,15,20)]',
          !src && `bg-gradient-to-br ${gradient}`,
          src && 'bg-[var(--token-card-bg)]',
          !borderLottieUrl && !borderImageUrl && borderStyle.className
        )}
        style={!borderLottieUrl && !borderImageUrl ? borderStyle.style : undefined}
      >
        {lottieUrl ? (
          <LottieRenderer codepoint={lottieUrl} emoji={name || alt} size={cfg.px} autoplay loop />
        ) : src ? (
          <img src={src} alt={alt || name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className={cn('select-none font-semibold text-white', cfg.text)}>
            {getInitials(name)}
          </span>
        )}

        {/* Typing indicator overlay */}
        {typing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1 w-1 rounded-full bg-white"
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status indicator dot — Discord style */}
      {status && status !== 'invisible' && (
        <span
          className={cn(
            'absolute bottom-0 right-0',
            cfg.statusDot,
            'rounded-full',
            statusColors[status],
            cfg.statusRing,
            'ring-[rgb(15,15,20)]',
            status === 'dnd' &&
              'after:absolute after:inset-x-[2px] after:top-1/2 after:h-[2px] after:-translate-y-1/2 after:rounded-full after:bg-[var(--token-bg-primary)]'
          )}
        />
      )}

      {/* Badge slot */}
      {badge && <span className="absolute -right-1 -top-1">{badge}</span>}
    </div>
  );

  if (borderLottieUrl) {
    // Lottie frames have decorative elements that extend beyond the avatar
    const frameBorderWidth = Math.max(6, Math.round(cfg.px * 0.2));
    return (
      <LottieBorderRenderer
        lottieUrl={borderLottieUrl}
        avatarSize={cfg.px}
        borderWidth={frameBorderWidth}
      >
        {avatarContent}
      </LottieBorderRenderer>
    );
  }

  if (borderImageUrl) {
    const frameBorderWidth = Math.max(2, Math.round(cfg.px * 0.06));
    const frameSize = cfg.px + frameBorderWidth * 2;
    return (
      <span
        className="cgraph-game-avatar-frame relative isolate inline-flex items-center justify-center overflow-visible"
        style={{ width: frameSize, height: frameSize }}
      >
        <img
          src={borderImageUrl}
          alt=""
          className="cgraph-game-avatar-frame-asset pointer-events-none absolute inset-0 z-[3] h-full w-full object-contain"
          loading="lazy"
        />
        <span className="relative z-[1] inline-flex items-center justify-center opacity-100">
          {avatarContent}
        </span>
      </span>
    );
  }

  return avatarContent;
}

interface AvatarGroupProps {
  readonly children: ReactNode;
  readonly max?: number;
  readonly size?: AvatarSize;
}
/** Avatar Group. */
export function AvatarGroup({ children, max = 3, size = 'md' }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visible = childArray.slice(0, max);
  const overflow = childArray.length - max;

  const overlap: Record<AvatarSize, string> = {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
    xl: '-ml-4',
    '2xl': '-ml-5',
    '3xl': '-ml-6',
  };

  return (
    <div className="flex items-center">
      {visible.map((child, i) => (
        <div
          key={i}
          className={cn(
            'relative rounded-full ring-2 ring-[rgb(15,15,20)]',
            i > 0 && overlap[size]
          )}
          style={{ zIndex: visible.length - i }}
        >
          {child}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(overlap[size], 'relative rounded-full ring-2 ring-[rgb(15,15,20)]')}
          style={{ zIndex: 0 }}
        >
          <div
            className={cn(
              sizeConfig[size].container,
              'flex items-center justify-center rounded-full bg-[var(--token-bg-secondary)]',
              sizeConfig[size].text,
              'font-semibold text-[var(--token-text-secondary)]'
            )}
          >
            +{overflow}
          </div>
        </div>
      )}
    </div>
  );
}
