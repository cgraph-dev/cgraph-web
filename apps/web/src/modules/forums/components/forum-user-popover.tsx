/**
 * Forum User Popover — C2
 *
 * Wraps a username element with a hover-activated popover
 * showing a compact forum profile card (avatar, stats, actions).
 */

import { useState, useRef, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { formatTimeAgo } from '@/lib/utils';

interface ForumUserInfo {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
  postCount?: number;
  reputation?: number;
  joinedAt?: string;
  isOnline?: boolean;
  userGroup?: string;
}

interface ForumUserPopoverProps {
  user: ForumUserInfo;
  children: ReactNode;
}

const HOVER_DELAY = 300;

/** Hover popover displaying forum user profile info. */
export function ForumUserPopover({ user, children }: ForumUserPopoverProps) {
  const [open, setOpen] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const handleMouseEnter = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    enterTimer.current = setTimeout(() => setOpen(true), HOVER_DELAY);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    leaveTimer.current = setTimeout(() => setOpen(false), HOVER_DELAY);
  }, []);

  const handleViewProfile = useCallback(() => {
    setOpen(false);
    navigate(`/profile/${user.username ?? user.id}`);
  }, [navigate, user.username, user.id]);

  const handleMessage = useCallback(() => {
    setOpen(false);
    navigate(`/chat/new?to=${user.id}`);
  }, [navigate, user.id]);

  const displayName = user.displayName || user.username || 'User';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <PopoverTrigger asChild>
          <span className="cursor-pointer">{children}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[260px] p-3">
          <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* Avatar + Name */}
            <div className="mb-3 flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <ThemedAvatar
                  src={user.avatarUrl}
                  alt={displayName}
                  size="large"
                  avatarBorderId={user.avatarBorderId ?? user.avatar_border_id ?? null}
                />
                {user.isOnline !== undefined && (
                  <div
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[rgba(13,17,23,0.92)] ${
                      user.isOnline ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{displayName}</div>
                {user.username && (
                  <div className="truncate text-xs text-gray-500">@{user.username}</div>
                )}
                {user.userGroup && (
                  <span className="bg-purple-500/20 mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-purple-400">
                    {user.userGroup}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mb-3 grid grid-cols-3 gap-2 text-center text-[11px]">
              {user.postCount !== undefined && (
                <div>
                  <div className="font-semibold text-gray-300">
                    {user.postCount.toLocaleString()}
                  </div>
                  <div className="text-gray-500">Posts</div>
                </div>
              )}
              {user.reputation !== undefined && (
                <div>
                  <div className="font-semibold text-gray-300">{user.reputation}</div>
                  <div className="text-gray-500">Rep</div>
                </div>
              )}
              {user.joinedAt && (
                <div>
                  <div className="font-semibold text-gray-300">{formatTimeAgo(user.joinedAt)}</div>
                  <div className="text-gray-500">Joined</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleMessage}
                className="flex-1 rounded-lg bg-primary-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
              >
                Message
              </button>
              <button
                onClick={handleViewProfile}
                className="flex-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
              >
                View Profile
              </button>
            </div>
          </div>
        </PopoverContent>
      </div>
    </Popover>
  );
}
