/**
 * MemberItem Component
 *
 * Displays a single member in the sidebar with avatar,
 * status indicator, and role color.
 */

import type { MemberItemProps } from './types';
import { getAvatarInitial, getDisplayName } from './utils';

/** Compact member row with presence and role color. */
export function MemberItem({ member, isOffline = false }: MemberItemProps) {
  const roleColor = member.roles?.[0]?.color;
  const displayName = getDisplayName(member.user.username, member.user.displayName);
  const initial = getAvatarInitial(member.user.username, member.user.displayName);

  return (
    <div
      className="cgraph-list-row flex items-center gap-2 px-2 py-1.5"
      data-offline={isOffline || undefined}
    >
      <div className="relative">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-[var(--product-surface-recessed)]">
          {member.user.avatarUrl ? (
            <img
              src={member.user.avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--token-text-muted)]">
              {initial}
            </div>
          )}
        </div>
        {!isOffline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--product-surface-pane)] bg-[var(--token-feedback-success)]" />
        )}
      </div>
      <span
        className="truncate text-sm"
        style={{ color: roleColor || 'var(--token-text-primary)' }}
      >
        {member.nickname || displayName}
      </span>
    </div>
  );
}
