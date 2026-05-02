/** Hover card for compact user profile previews. */
import { type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';

interface UserCardData {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bannerColor?: string;
  avatarBorderId?: string | null;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: { emoji?: string; text: string };
  bio?: string;
  roles?: { name: string; color: string }[];
  mutualFriends?: number;
}

interface UserCardPopoverProps {
  user: UserCardData;
  children: ReactNode;
  onMessage?: () => void;
  onAddFriend?: () => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

/**
 * Wraps a trigger element and shows detailed user info on hover or click.
 */
export function UserCardPopover({
  user,
  children,
  onMessage,
  onAddFriend,
  side = 'right',
  className,
}: UserCardPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={side}
          sideOffset={8}
          align="start"
          className={cn(
            'z-[var(--z-popover,500)] w-[300px] overflow-hidden rounded-lg',
            'border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] shadow-2xl',
            'animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
            className
          )}
        >
          {/* Banner */}
          <div
            className="h-[60px] w-full"
            style={{ backgroundColor: user.bannerColor ?? '#5865F2' }}
          />

          {/* Avatar overlapping banner */}
          <div className="relative px-4 pb-3">
            <div className="-mt-8">
              <Avatar
                size="xl"
                name={user.displayName}
                src={user.avatarUrl}
                status={user.status}
                borderId={user.avatarBorderId}
                className="ring-4 ring-[rgb(18,18,24)]"
              />
            </div>

            {/* Name + username */}
            <div className="mt-2">
              <p className="text-sm font-bold text-white">{user.displayName}</p>
              <p className="text-xs text-white/40">@{user.username}</p>
            </div>

            {/* Custom status */}
            {user.customStatus && (
              <p className="mt-1 text-xs text-white/50">
                {user.customStatus.emoji && <span className="mr-1">{user.customStatus.emoji}</span>}
                {user.customStatus.text}
              </p>
            )}

            {/* Bio */}
            {user.bio && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/50">{user.bio}</p>
            )}

            {/* Roles */}
            {user.roles && user.roles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {user.roles.map((role) => (
                  <span
                    key={role.name}
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: role.color + '20',
                      color: role.color,
                    }}
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            )}

            {/* Mutual friends */}
            {user.mutualFriends !== undefined && user.mutualFriends > 0 && (
              <p className="mt-2 text-[11px] text-white/30">
                {user.mutualFriends} mutual friend{user.mutualFriends > 1 ? 's' : ''}
              </p>
            )}

            {/* Divider */}
            <div className="my-3 h-px bg-[var(--token-card-bg)]" />

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onMessage}
                className={cn(
                  'flex-1 rounded-md py-1.5 text-xs font-medium',
                  'bg-[var(--token-accent)] text-white hover:bg-[var(--token-accent-hover)]',
                  'transition-colors'
                )}
              >
                Message
              </button>
              <button
                type="button"
                onClick={onAddFriend}
                className={cn(
                  'flex-1 rounded-md py-1.5 text-xs font-medium',
                  'bg-[var(--token-card-bg)] text-white/70 hover:bg-[var(--token-hover)]',
                  'transition-colors'
                )}
              >
                Add Friend
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default UserCardPopover;
