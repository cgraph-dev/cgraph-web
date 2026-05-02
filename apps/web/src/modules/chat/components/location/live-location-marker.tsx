/**
 * Individual live location marker rendered on the map.
 *
 * Shows user avatar with directional heading indicator and a pulsing
 * accuracy ring. Color is deterministic based on user_id hash.
 */
import { type ReactNode, useMemo } from 'react';
import { motion } from 'motion/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LiveLocationMarkerProps {
  readonly userId: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly heading: number;
  readonly accuracy: number;
  readonly isCurrentUser: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_COLORS: readonly string[] = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

const DEFAULT_COLOR = '#3b82f6';

/** Deterministic color from userId string hash. */
function userColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length] ?? DEFAULT_COLOR;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Map marker for a single live location sharer.
 *
 * Renders an avatar circle with a directional heading arrow and an
 * animated accuracy ring that pulses to indicate GPS precision.
 */
function LiveLocationMarker(props: LiveLocationMarkerProps): ReactNode {
  const { userId, displayName, avatarUrl, heading, accuracy, isCurrentUser } = props;

  const color = useMemo(() => userColor(userId), [userId]);

  const ringSize = Math.max(24, Math.min(accuracy * 2, 120));

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: ringSize, height: ringSize }}
    >
      {/* Accuracy ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: ringSize,
          height: ringSize,
          backgroundColor: `${color}20`,
          border: `2px solid ${color}40`,
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Heading indicator */}
      <div
        className="absolute"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: `12px solid ${color}`,
          transform: `rotate(${heading}deg) translateY(-20px)`,
          transformOrigin: 'center bottom',
        }}
      />

      {/* Avatar circle */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full border-2 shadow-md"
        style={{
          width: 32,
          height: 32,
          borderColor: isCurrentUser ? '#22c55e' : color,
          backgroundColor: color,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span className="text-xs font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name label */}
      <div className="absolute -bottom-5 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
        {isCurrentUser ? 'You' : displayName}
      </div>
    </div>
  );
}

export { LiveLocationMarker };
export type { LiveLocationMarkerProps };
