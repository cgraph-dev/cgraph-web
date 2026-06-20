/**
 * Postbit Sidebar — Classic forum author panel
 *
 * MyBB-style left-side author info panel per post:
 * - Avatar (with border cosmetic)
 * - Username + user title
 * - Post count, reputation, join date
 * - Online status dot
 * - Group badge
 */

import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { InlineTitle } from '@/shared/components/ui/inline-title';
import { ForumUserPopover } from '../../forum-user-popover';
import { GiveRepButton } from './give-rep-button';
import { UserAwards } from '../../user-awards';

interface PostbitAuthor {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
  equippedTitleId?: string | null;
  reputation?: number;
  postCount?: number;
  joinedAt?: string;
  isOnline?: boolean;
  userGroup?: string;
  userTitle?: string;
}

interface PostbitSidebarProps {
  author: PostbitAuthor;
  forumId?: string;
  postId?: string;
  currentUserId?: string;
}

/** Post-count-based title presets (matches backend ForumUserGroup.default_user_titles) */
const USER_TITLE_PRESETS = [
  { min: 501, title: 'Expert' },
  { min: 201, title: 'Senior Member' },
  { min: 51, title: 'Member' },
  { min: 11, title: 'Junior Member' },
  { min: 0, title: 'Newbie' },
] as const;

function titleForPostCount(postCount: number): string {
  for (const preset of USER_TITLE_PRESETS) {
    if (postCount >= preset.min) return preset.title;
  }
  return 'Newbie';
}

function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Postbit Sidebar component.
 */
export function PostbitSidebar({ author, forumId, postId, currentUserId }: PostbitSidebarProps) {
  return (
    <div className="flex w-36 flex-shrink-0 flex-col items-center gap-2 border-r border-[var(--token-card-border)] pr-4 text-center">
      {/* Online indicator + Avatar */}
      <div className="relative">
        <ThemedAvatar
          src={author.avatarUrl}
          alt={author.displayName ?? author.username ?? 'User'}
          size="large"
          avatarBorderId={author.avatarBorderId ?? author.avatar_border_id ?? null}
        />
        {author.isOnline !== undefined && (
          <div
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--token-card-bg)] ${
              author.isOnline ? 'bg-green-500' : 'bg-gray-600'
            }`}
          />
        )}
      </div>

      {/* Username */}
      <ForumUserPopover user={author}>
        <span className="cursor-pointer text-sm font-semibold hover:underline">
          {author.displayName || author.username}
        </span>
      </ForumUserPopover>

      {/* User title */}
      {author.equippedTitleId && <InlineTitle titleId={author.equippedTitleId} size="sm" />}

      {/* Auto-title from post count (shown when no custom title) */}
      {!author.equippedTitleId && author.postCount !== undefined && (
        <span className="text-[10px] italic text-gray-500">
          {author.userTitle ?? titleForPostCount(author.postCount)}
        </span>
      )}

      {/* Group badge */}
      {author.userGroup && (
        <span className="bg-purple-500/20 rounded-full px-2 py-0.5 text-[10px] font-medium text-purple-400">
          {author.userGroup}
        </span>
      )}

      {/* Forum awards */}
      {forumId && <UserAwards forumId={forumId} userId={author.id} />}

      {/* Stats */}
      <div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
        {author.postCount !== undefined && (
          <div>
            Posts: <span className="text-gray-400">{author.postCount.toLocaleString()}</span>
          </div>
        )}
        {author.reputation !== undefined && (
          <div>
            Rep:{' '}
            <span
              className={
                author.reputation > 0
                  ? 'text-green-400'
                  : author.reputation < 0
                    ? 'text-red-400'
                    : 'text-gray-400'
              }
            >
              {author.reputation}
            </span>
          </div>
        )}
        {author.joinedAt && (
          <div>
            Joined: <span className="text-gray-400">{formatJoinDate(author.joinedAt)}</span>
          </div>
        )}
      </div>

      {/* Give Rep Button */}
      {forumId && postId && currentUserId && (
        <GiveRepButton
          forumId={forumId}
          postId={postId}
          postAuthorId={author.id}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
