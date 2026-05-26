/**
 * Hook for invite management operations.
 */
import { useState, useEffect } from 'react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';
import { getGroupPermissionError } from '../../permission-errors';

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

interface InviteRecord {
  readonly id?: unknown;
  readonly code?: unknown;
  readonly url?: unknown;
  readonly max_uses?: unknown;
  readonly maxUses?: unknown;
  readonly uses?: unknown;
  readonly expires_at?: unknown;
  readonly expiresAt?: unknown;
  readonly creator_id?: unknown;
  readonly creatorId?: unknown;
  readonly creator_username?: unknown;
  readonly creatorUsername?: unknown;
  readonly created_by?: unknown;
  readonly createdBy?: unknown;
  readonly creator?: unknown;
  readonly created_at?: unknown;
  readonly createdAt?: unknown;
}

interface InviteFallback {
  readonly id?: string;
  readonly maxUses?: number | null;
  readonly expiresAt?: string | null;
  readonly createdBy?: Invite['createdBy'];
  readonly createdAt?: string;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readNullableNumber(value: unknown): number | null | undefined {
  if (value === null) return null;
  return readNumber(value);
}

function readNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return readString(value);
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : undefined;
}

function firstDefined<T>(...values: Array<T | undefined>): T | undefined {
  return values.find((value): value is T => value !== undefined);
}

function normalizeInvite(invite: InviteRecord, fallback: InviteFallback = {}): Invite {
  const code = readString(invite.code) ?? '';
  const createdByRecord =
    readRecord(invite.created_by) ?? readRecord(invite.createdBy) ?? readRecord(invite.creator);
  const creatorId =
    readString(invite.creator_id) ??
    readString(invite.creatorId) ??
    readString(createdByRecord?.id) ??
    fallback.createdBy?.id ??
    '';
  const creatorUsername =
    readString(invite.creator_username) ??
    readString(invite.creatorUsername) ??
    readString(createdByRecord?.username) ??
    fallback.createdBy?.username ??
    'unknown';

  return {
    id: readString(invite.id) ?? fallback.id ?? code,
    code,
    url: readString(invite.url) ?? `${window.location.origin}/invite/${code}`,
    maxUses:
      firstDefined(
        readNullableNumber(invite.max_uses),
        readNullableNumber(invite.maxUses),
        fallback.maxUses
      ) ?? null,
    uses: readNumber(invite.uses) ?? 0,
    expiresAt:
      firstDefined(
        readNullableString(invite.expires_at),
        readNullableString(invite.expiresAt),
        fallback.expiresAt
      ) ?? null,
    createdBy: {
      id: creatorId,
      username: creatorUsername,
    },
    createdAt:
      readString(invite.created_at) ??
      readString(invite.createdAt) ??
      fallback.createdAt ??
      new Date().toISOString(),
  };
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
 */
/**
 * Hook for managing invite manager.
 *
 * @param groupId - The group id.
 */
/**
 *
 * Description.
 */
export function useInviteManager(groupId?: string) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiration, setExpiration] = useState<number | null>(24 * 60 * 60);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch existing invites
  useEffect(() => {
    if (!groupId) return;
    apiClient.groups
      .getInvites(groupId)
      .then((result) => {
        if (!result.ok) {
          setErrorMessage(
            getGroupPermissionError(
              result.error,
              'You do not have permission to view invites for this group.',
              'Could not load invites. Please try again.'
            )
          );
          return;
        }
        setErrorMessage(null);
        setInvites(result.data.map((inv) => normalizeInvite(inv)));
      })
      .catch((error) => {
        logger.error('Invite load failed', error);
        setErrorMessage(
          getGroupPermissionError(
            error,
            'You do not have permission to view invites for this group.',
            'Could not load invites. Please try again.'
          )
        );
      });
  }, [groupId]);

  const handleGenerateInvite = async () => {
    if (!groupId) return;
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const result = await apiClient.groups.createInvite(groupId, {
        max_uses: maxUses ?? undefined,
        expires_in: expiration ?? undefined,
      });
      if (!result.ok) throw new Error(result.error.message);
      const inv = result.data;
      const newInvite = normalizeInvite(inv, {
        id: Date.now().toString(),
        maxUses,
        expiresAt: expiration ? new Date(Date.now() + expiration * 1000).toISOString() : null,
        createdBy: { id: 'me', username: 'You' },
        createdAt: new Date().toISOString(),
      });

      setInvites((currentInvites) => [newInvite, ...currentInvites]);
      setInviteLink(newInvite.url);
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to generate invite:', error);
      setErrorMessage(
        getGroupPermissionError(
          error,
          'You do not have permission to create invites for this group.',
          'Could not generate invite. Please try again.'
        )
      );
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
    setErrorMessage(null);
    const previousInvites = invites;
    setInvites(invites.filter((i) => i.id !== inviteId));
    HapticFeedback.warning();
    if (groupId) {
      apiClient.groups
        .deleteInvite(groupId, inviteId)
        .then((result) => {
          if (!result.ok) {
            setInvites(previousInvites);
            setErrorMessage(
              getGroupPermissionError(
                result.error,
                'You do not have permission to delete invites for this group.',
                'Could not delete invite. Please try again.'
              )
            );
          }
        })
        .catch((error) => {
          logger.error('Invite deletion failed', error);
          setInvites(previousInvites);
          setErrorMessage(
            getGroupPermissionError(
              error,
              'You do not have permission to delete invites for this group.',
              'Could not delete invite. Please try again.'
            )
          );
        });
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
    errorMessage,
    handleGenerateInvite,
    handleCopyLink,
    handleDeleteInvite,
    formatExpiration,
  };
}
