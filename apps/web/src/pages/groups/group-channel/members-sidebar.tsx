import { MemberItem } from './member-item';
import type { MembersSidebarProps } from './types';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui/button';

/** Online and offline member directory. */
export function MembersSidebar({ onlineMembers, offlineMembers, onClose }: MembersSidebarProps) {
  const isEmpty = onlineMembers.length === 0 && offlineMembers.length === 0;

  return (
    <aside
      className="cgraph-pane absolute inset-0 z-40 flex w-full flex-col overflow-hidden border-l xl:static xl:w-60"
      aria-label="Group members"
    >
      <div className="cgraph-pane-header flex h-14 shrink-0 items-center justify-between px-4 xl:hidden">
        <h2 className="text-sm font-semibold text-[var(--token-text-primary)]">Members</h2>
        <IconButton
          icon={<X />}
          label="Close members"
          size="sm"
          onClick={onClose}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isEmpty && (
          <p className="px-5 py-8 text-center text-sm text-[var(--token-text-muted)]">
            No members to show
          </p>
        )}

        {onlineMembers.length > 0 && (
          <div className="p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--token-text-muted)]">
              Online - {onlineMembers.length}
            </h3>
            <div className="space-y-0.5">
              {onlineMembers.map((member) => (
                <MemberItem key={member.id} member={member} />
              ))}
            </div>
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div className="p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase text-[var(--token-text-muted)]">
              Offline - {offlineMembers.length}
            </h3>
            <div className="space-y-0.5">
              {offlineMembers.map((member) => (
                <MemberItem key={member.id} member={member} isOffline />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
