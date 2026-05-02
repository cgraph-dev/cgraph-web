/**
 * Hook for invite management operations.
 */
import { useState, useEffect } from 'react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';

const logger = createLogger('InviteModal');

export interface Invite {
  id: string;
  code: string;
  url: string;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  createdBy: {
    id: string;
    username: string;
  };
  createdAt: string;
}

export const EXPIRATION_OPTIONS = [
  { value: null, label: 'Never' },
  { value: 30 * 60, label: '30 minutes' },
  { value: 60 * 60, label: '1 hour' },
  { value: 6 * 60 * 60, label: '6 hours' },
  { value: 12 * 60 * 60, label: '12 hours' },
  { value: 24 * 60 * 60, label: '1 day' },
  { value: 7 * 24 * 60 * 60, label: '7 days' },
];

export const MAX_USES_OPTIONS = [
  { value: null, label: 'No limit' },
  { value: 1, label: '1 use' },
  { value: 5, label: '5 uses' },
  { value: 10, label: '10 uses' },
  { value: 25, label: '25 uses' },
  { value: 50, label: '50 uses' },
  { value: 100, label: '100 uses' },
];

/**
 * Hook for managing invite manager.
 *
 * @param groupId - The group id.
 */
export function useInviteManager(groupId?: string) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiration, setExpiration] = useState<number | null>(24 * 60 * 60);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);

  // Fetch existing invites
  useEffect(() => {
    if (!groupId) return;
    apiClient.groups
      .getInvites(groupId)
      .then((result) => {
        if (!result.ok) return;
        setInvites(
          result.data.map((inv) => ({
            id: inv.id,
            code: inv.code,
            url: `${window.location.origin}/invite/${inv.code}`,
            maxUses: inv.max_uses ?? inv.maxUses ?? null,
            uses: inv.uses ?? 0,
            expiresAt: inv.expires_at ?? inv.expiresAt ?? null,
            createdBy: {
              id: String(inv.creator_id ?? inv.creatorId ?? ''),
              username: String(inv.creator_username ?? inv.creatorUsername ?? 'unknown'),
            },
            createdAt: inv.created_at ?? inv.createdAt ?? new Date().toISOString(),
          }))
        );
      })
      .catch((e) => logger.error('Invite creation failed', e));
  }, [groupId]);

  const handleGenerateInvite = async () => {
    if (!groupId) return;
    setIsGenerating(true);
    try {
      const result = await apiClient.groups.createInvite(groupId, {
        max_uses: maxUses ?? undefined,
        expires_in: expiration ?? undefined,
      });
      if (!result.ok) throw new Error(result.error.message);
      const inv = result.data;
      const inviteCode = inv.code;
      const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;

      const newInvite: Invite = {
        id: inv.id || Date.now().toString(),
        code: inviteCode,
        url: inviteUrl,
        maxUses,
        uses: 0,
        expiresAt: expiration ? new Date(Date.now() + expiration * 1000).toISOString() : null,
        createdBy: { id: 'me', username: 'You' },
        createdAt: new Date().toISOString(),
      };

      setInvites([newInvite, ...invites]);
      setInviteLink(inviteUrl);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to generate invite:', error);
      HapticFeedback.error();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      HapticFeedback.success();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy:', error);
    }
  };

  const handleDeleteInvite = (inviteId: string) => {
    setInvites(invites.filter((i) => i.id !== inviteId));
    HapticFeedback.warning();
    if (groupId) {
      apiClient.groups
        .deleteInvite(groupId, inviteId)
        .catch((e) => logger.error('Invite deletion failed', e));
    }
  };

  const formatExpiration = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never expires';
    const date = new Date(expiresAt);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return 'Expired';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours`;
    return `${Math.floor(diff / 86400000)} days`;
  };

  return {
    activeTab,
    setActiveTab,
    inviteLink,
    copied,
    isGenerating,
    expiration,
    setExpiration,
    maxUses,
    setMaxUses,
    invites,
    handleGenerateInvite,
    handleCopyLink,
    handleDeleteInvite,
    formatExpiration,
  };
}
