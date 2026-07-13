/**
 * InviteFriendsPage — manage platform invite codes and referral stats.
 *
 * Accessible from Settings. Shows existing invites, allows creating new
 * ones, and displays Node rewards earned from referrals.
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
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
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Invite Friends</h1>
        <p className="mt-1 text-foreground-muted">
          Share your invite link and earn 50 Nodes for each friend who joins CGraph.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard variant="frosted">
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-primary-400">{stats.total_referrals}</p>
            <p className="mt-1 text-sm text-foreground-muted">Friends Invited</p>
          </div>
        </GlassCard>
        <GlassCard variant="frosted">
          <div className="p-4 text-center">
            <p className="text-3xl font-bold text-primary-400">{stats.total_nodes_earned}</p>
            <p className="mt-1 text-sm text-foreground-muted">Nodes Earned</p>
          </div>
        </GlassCard>
      </div>

      {/* Create new invite */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating}
          className="shadow-primary-500/25 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create New Invite'}
        </button>
      </div>

      {/* Invite list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : invites.length === 0 ? (
        <GlassCard variant="frosted">
          <div className="p-8 text-center">
            <p className="text-foreground-muted">
              No invites yet. Create one to start inviting friends!
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => (
            <motion.div
              key={invite.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <code className="text-sm font-medium text-foreground">
                    {INVITE_BASE_URL}
                    {invite.code}
                  </code>
                  <div className="mt-1 flex items-center gap-3 text-xs text-foreground-muted">
                    <span>
                      {invite.uses} / {invite.max_uses} uses
                    </span>
                    {invite.expires_at && (
                      <span>Expires {new Date(invite.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(invite)}
                  className="bg-primary-500/20 hover:bg-primary-500/30 flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-primary-400 transition-all"
                >
                  {copiedId === invite.id ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
