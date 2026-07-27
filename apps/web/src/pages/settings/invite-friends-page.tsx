/**
 * InviteFriendsPage — manage platform invite codes and referral stats.
 *
 * Accessible from Settings. Shows existing invites, allows creating new
 * ones, and displays Node rewards earned from referrals.
 */

import { useState, useEffect } from 'react';
import { ClipboardDocumentIcon, PlusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { GlassCard, Skeleton } from '@/shared/components/ui';
import { apiClient, http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('InviteFriendsPage');

const INVITE_BASE_URL = `${window.location.origin}/invite/`;

interface InviteItem {
  readonly id: string;
  readonly code: string;
  readonly uses: number;
  readonly max_uses: number;
  readonly expires_at: string | null;
  readonly created_at: string;
}

interface ReferralStats {
  readonly total_referrals: number;
  readonly total_nodes_earned: number;
}

/**
 * Invite friends page for settings.
 */
export default function InviteFriendsPage() {
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [stats, setStats] = useState<ReferralStats>({ total_referrals: 0, total_nodes_earned: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvites() {
      try {
        const listResult = await apiClient.invites.list();
        if (listResult.ok) {
          setInvites(
            listResult.data.map((inv) => ({
              id: inv.id,
              code: inv.code,
              uses: inv.uses,
              max_uses: inv.max_uses,
              expires_at: inv.expires_at ?? null,
              created_at: inv.created_at ?? new Date().toISOString(),
            }))
          );
        }
        // Stats not available through typed client — fetch separately
        try {
          const res = await http.get<{ data: { stats: ReferralStats } }>('/api/v1/invites');
          const data = res.data?.data ?? res.data;
          const rawStats =
            data instanceof Object && 'stats' in data && data.stats instanceof Object
              ? data.stats
              : {};
          const statsEntries = Object.fromEntries(Object.entries(rawStats));
          setStats({
            total_referrals:
              typeof statsEntries.total_referrals === 'number' ? statsEntries.total_referrals : 0,
            total_nodes_earned:
              typeof statsEntries.total_nodes_earned === 'number'
                ? statsEntries.total_nodes_earned
                : 0,
          });
        } catch {
          // Stats fetch is optional
        }
      } catch (error) {
        logger.error('Failed to load invites', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadInvites();
  }, []);

  async function handleCreate() {
    setIsCreating(true);
    try {
      const result = await apiClient.invites.create();
      if (!result.ok) throw new Error(result.error.message);
      const inv = result.data;
      const newInvite: InviteItem = {
        id: inv.id,
        code: inv.code,
        uses: inv.uses,
        max_uses: inv.max_uses,
        expires_at: inv.expires_at ?? null,
        created_at: inv.created_at ?? new Date().toISOString(),
      };
      setInvites((prev) => [newInvite, ...prev]);
    } catch (error) {
      logger.error('Failed to create invite', error);
    } finally {
      setIsCreating(false);
    }
  }

  function handleCopy(invite: InviteItem) {
    const link = `${INVITE_BASE_URL}${invite.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div className="cgraph-content mx-auto max-w-3xl space-y-5">
      <header className="cgraph-page-header">
        <div className="flex items-start gap-3">
          <div className="cgraph-empty-icon mb-0 h-10 w-10 shrink-0">
            <UserPlusIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="cgraph-eyebrow">Invitations</p>
            <h1 className="text-2xl font-semibold text-[var(--token-text-primary)]">
              Invite Friends
            </h1>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">
              Share an invite link and earn 50 Nodes for each friend who joins CGraph.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={handleCreate}
          isLoading={isCreating}
          leftIcon={<PlusIcon />}
          animated={false}
        >
          Create invite
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard>
          <div className="p-4 text-center">
            <p className="text-2xl font-semibold text-[var(--token-text-primary)]">
              {stats.total_referrals}
            </p>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">Friends invited</p>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="p-4 text-center">
            <p className="text-2xl font-semibold text-[var(--token-text-primary)]">
              {stats.total_nodes_earned}
            </p>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">Nodes earned</p>
          </div>
        </GlassCard>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-label="Loading invites">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="cgraph-card flex items-center gap-4 p-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          ))}
        </div>
      ) : invites.length === 0 ? (
        <GlassCard>
          <div className="cgraph-empty-state">
            <div className="cgraph-empty-icon">
              <UserPlusIcon className="h-6 w-6" />
            </div>
            <h2>No invites yet</h2>
            <p>Create an invite to start bringing friends into CGraph.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => (
            <GlassCard key={invite.id} className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <code className="break-all text-sm font-medium text-[var(--token-text-primary)]">
                    {INVITE_BASE_URL}
                    {invite.code}
                  </code>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--token-text-muted)]">
                    <span>
                      {invite.uses} / {invite.max_uses} uses
                    </span>
                    {invite.expires_at && (
                      <span>Expires {new Date(invite.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  animated={false}
                  leftIcon={<ClipboardDocumentIcon />}
                  onClick={() => handleCopy(invite)}
                  className="shrink-0"
                >
                  {copiedId === invite.id ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
