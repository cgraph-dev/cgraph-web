/**
 * MembersSidebar Component
 *
 * Displays online and offline members in a sidebar.
 */

import { MemberItem } from './member-item';
import type { MembersSidebarProps } from './types';
import { X } from 'lucide-react';

/**
 */
/**
 * Members Sidebar component.
 */
export function MembersSidebar({ onlineMembers, offlineMembers, onClose }: MembersSidebarProps) {
  return (
    <aside
      className="absolute inset-0 z-40 flex w-full flex-col overflow-hidden border-l border-[var(--token-border-muted)] bg-[var(--token-bg-primary)] xl:static xl:w-60 xl:bg-[var(--token-card-bg)/0.4]"
      aria-label="Group members"
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--token-border-muted)] px-4 xl:hidden">
        <h2 className="text-sm font-semibold text-white">Members</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white/65 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          aria-label="Close members"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Online members */}
        {onlineMembers.length > 0 && (
          <div className="p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
              Online - {onlineMembers.length}
            </h3>
            <div className="space-y-0.5">
              {onlineMembers.map((member) => (
                <MemberItem key={member.id} member={member} />
              ))}
            </div>
          </div>
        )}

        {/* Offline members */}
        {offlineMembers.length > 0 && (
          <div className="p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
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
