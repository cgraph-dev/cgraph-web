import { useState } from 'react';
import {
  ClipboardDocumentIcon,
  ClockIcon,
  LinkIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Button, IconButton } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { GlassCard } from '@/shared/components/ui';
import type { InvitesTabProps } from './types';
import { CreateInviteDialog } from './invites/create-invite-dialog';
import { DeleteInviteDialog } from './invites/delete-invite-dialog';
import {
  copyInviteUrl,
  formatInviteCreatedAt,
  formatInviteExpiry,
  getInviteStatus,
  useGroupInvites,
} from './invites/useGroupInvites';
import type { GroupInviteView } from './invites/types';

export function InvitesTab({
  groupId,
  groupName,
  canCreateInvites,
  canDeleteInvites,
}: InvitesTabProps) {
  const {
    invites,
    isLoading,
    loadError,
    isCreating,
    deletingInviteId,
    reload,
    createInvite,
    deleteInvite,
  } = useGroupInvites(groupId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GroupInviteView | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopy = async (url: string) => {
    const result = await copyInviteUrl(url);
    setCopyStatus(result.ok ? 'Invite link copied.' : result.error);
    return result;
  };

  return (
    <section className="max-w-3xl space-y-6" aria-labelledby="group-invites-title">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="group-invites-title" className="text-2xl font-bold text-white">
            Invites
          </h2>
          <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
            Create and manage invitation links for {groupName}.
          </p>
        </div>
        {canCreateInvites && (
          <Button
            size="sm"
            leftIcon={<PlusIcon />}
            onClick={() => setCreateDialogOpen(true)}
            className="min-h-11 lg:min-h-10"
          >
            Create invite
          </Button>
        )}
      </header>

      {(loadError || copyStatus) && (
        <div
          role={loadError ? 'alert' : 'status'}
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-4 py-3 text-sm text-[var(--token-text-secondary)]"
        >
          <span>{loadError ?? copyStatus}</span>
          {loadError && (
            <Button variant="outline" size="sm" onClick={reload}>
              Retry
            </Button>
          )}
        </div>
      )}

      <GlassCard variant="frosted" className="overflow-hidden">
        {isLoading ? (
          <InviteListSkeleton />
        ) : invites.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <LinkIcon className="mx-auto h-10 w-10 text-[var(--token-text-muted)]" />
            <h3 className="mt-3 text-base font-semibold text-white">No invite links</h3>
            <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
              Create a link when you are ready to invite people.
            </p>
          </div>
        ) : (
          <ul role="list" aria-label="Invite links" className="divide-y divide-white/10">
            {invites.map((invite) => {
              const status = getInviteStatus(invite);
              const creator =
                invite.inviter?.displayName ??
                invite.inviter?.username ??
                'Creator unavailable';

              return (
                <li
                  key={invite.id}
                  data-testid={`invite-row-${invite.code}`}
                  className="flex min-w-0 items-start justify-between gap-3 px-4 py-4 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <code className="truncate font-mono text-sm font-semibold text-[var(--token-text-primary)]">
                        {invite.code}
                      </code>
                      <span
                        data-status={status.kind}
                        className="rounded-full border border-[var(--token-card-border)] px-2 py-0.5 text-xs text-[var(--token-text-secondary)]"
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--token-text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <UserGroupIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {invite.uses === null ? 'Usage unavailable' : invite.uses}
                        {invite.maxUses !== null && invite.uses !== null
                          ? ` / ${invite.maxUses} uses`
                          : invite.uses !== null
                            ? ' uses'
                            : ''}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatInviteExpiry(invite.expiresAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--token-text-muted)]">
                      Created by {creator}
                      {invite.createdAt ? ` ${formatInviteCreatedAt(invite.createdAt)}` : ''}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <IconButton
                      icon={<ClipboardDocumentIcon />}
                      label={`Copy invite ${invite.code}`}
                      size="sm"
                      onClick={() => handleCopy(invite.url)}
                    />
                    {canDeleteInvites && (
                      <IconButton
                        icon={<TrashIcon />}
                        label={`Delete invite ${invite.code}`}
                        variant="danger"
                        size="sm"
                        disabled={deletingInviteId === invite.id}
                        onClick={() => setDeleteTarget(invite)}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>

      <CreateInviteDialog
        open={createDialogOpen}
        groupName={groupName}
        isCreating={isCreating}
        onOpenChange={setCreateDialogOpen}
        onCreate={createInvite}
        onCopy={handleCopy}
      />
      <DeleteInviteDialog
        invite={deleteTarget}
        isDeleting={Boolean(deleteTarget && deletingInviteId === deleteTarget.id)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDelete={deleteInvite}
      />
    </section>
  );
}

function InviteListSkeleton() {
  return (
    <div role="status" aria-label="Loading invite links" className="space-y-4 p-5">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton variant="text" width="38%" />
          <Skeleton variant="text" width="70%" />
        </div>
      ))}
    </div>
  );
}
