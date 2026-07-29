import { Link } from 'react-router-dom';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { publicProfilePath } from '@/lib/profile-route';
import type { MemberItemProps } from './types';
import { getDisplayName, getTopRole } from './utils';

/** Compact member row with presence and role color. */
export function MemberItem({ member, isOffline = false }: MemberItemProps) {
  const roleColor = getTopRole(member.roles)?.color;
  const displayName = getDisplayName(member.user.username, member.user.displayName);
  const profilePath = publicProfilePath(member.user);
  const presence = isOffline ? 'Offline' : 'Online';

  return (
    <Link
      to={profilePath}
      className="cgraph-list-row flex min-h-11 items-center gap-2 px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--token-focus-ring)]"
      data-offline={isOffline || undefined}
      title={`View ${displayName}'s profile`}
    >
      <div className="relative shrink-0">
        <ThemedAvatar
          src={member.user.avatarUrl}
          alt={displayName}
          size="small"
          avatarBorderId={member.user.avatarBorderId}
          fallbackText={displayName}
        />
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--product-surface-pane)] ${
            isOffline
              ? 'bg-[var(--token-text-muted)]'
              : 'bg-[var(--token-feedback-success)]'
          }`}
          role="status"
          aria-label={presence}
        />
      </div>
      <span
        className="min-w-0 truncate text-sm font-medium"
        style={{ color: roleColor || 'var(--token-text-primary)' }}
      >
        {member.nickname || displayName}
      </span>
    </Link>
  );
}
