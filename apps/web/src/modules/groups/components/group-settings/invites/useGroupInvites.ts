import { useCallback, useEffect, useRef, useState } from 'react';
import type { GroupInvite } from '@cgraph-dev/api-client';
import { apiClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { formatTimeAgo, safeParseDate } from '@/lib/utils';
import { getGroupPermissionError } from '../../../permission-errors';
import type {
  CreateInviteOptions,
  GroupInviteView,
  InviteOperationResult,
} from './types';

const logger = createLogger('GroupInvites');

export const EXPIRATION_OPTIONS = [
  { value: '', label: 'Never' },
  { value: '3600', label: '1 hour' },
  { value: '86400', label: '1 day' },
  { value: '604800', label: '7 days' },
] as const;

export const MAX_USES_OPTIONS = [
  { value: '', label: 'No limit' },
  { value: '1', label: '1 use' },
  { value: '10', label: '10 uses' },
  { value: '50', label: '50 uses' },
  { value: '100', label: '100 uses' },
] as const;

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

export function normalizeGroupInvite(invite: GroupInvite): GroupInviteView {
  const record = readRecord(invite) ?? {};
  const inviter =
    readRecord(record.inviter) ??
    readRecord(record.creator) ??
    readRecord(record.created_by) ??
    readRecord(record.createdBy);
  const code = invite.code;

  return {
    id: invite.id,
    code,
    url: new URL(`/invite/${encodeURIComponent(code)}`, window.location.origin).toString(),
    uses: readNumber(record.uses),
    maxUses: readNumber(record.max_uses ?? record.maxUses),
    expiresAt: readString(record.expires_at ?? record.expiresAt),
    createdAt: readString(record.created_at ?? record.createdAt),
    revoked: readBoolean(record.revoked ?? record.is_revoked ?? record.isRevoked),
    inviter: inviter
      ? {
          id: readString(inviter.id),
          username: readString(inviter.username),
          displayName: readString(inviter.display_name ?? inviter.displayName),
        }
      : null,
  };
}

function compareInvites(left: GroupInviteView, right: GroupInviteView): number {
  const leftStatus = getInviteStatus(left).kind === 'active' ? 0 : 1;
  const rightStatus = getInviteStatus(right).kind === 'active' ? 0 : 1;
  if (leftStatus !== rightStatus) return leftStatus - rightStatus;

  const leftCreatedAt = safeParseDate(left.createdAt)?.getTime() ?? 0;
  const rightCreatedAt = safeParseDate(right.createdAt)?.getTime() ?? 0;
  return rightCreatedAt - leftCreatedAt || left.code.localeCompare(right.code);
}

function sortInvites(invites: GroupInviteView[]): GroupInviteView[] {
  return [...invites].sort(compareInvites);
}

export function getInviteStatus(invite: GroupInviteView): {
  kind: 'active' | 'expired' | 'limit-reached' | 'revoked';
  label: string;
} {
  if (invite.revoked) return { kind: 'revoked', label: 'Revoked' };
  const expiry = safeParseDate(invite.expiresAt);
  if (expiry && expiry.getTime() <= Date.now()) {
    return { kind: 'expired', label: 'Expired' };
  }
  if (
    invite.maxUses !== null &&
    invite.uses !== null &&
    invite.uses >= invite.maxUses
  ) {
    return { kind: 'limit-reached', label: 'Limit reached' };
  }
  return { kind: 'active', label: 'Active' };
}

export function formatInviteExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'Never expires';
  const expiry = safeParseDate(expiresAt);
  if (!expiry) return 'Expiry unavailable';
  if (expiry.getTime() <= Date.now()) return 'Expired';
  return `Expires ${formatTimeAgo(expiry)}`;
}

export function formatInviteCreatedAt(createdAt: string): string {
  const created = safeParseDate(createdAt);
  return created ? formatTimeAgo(created) : '';
}

export async function copyInviteUrl(
  url: string
): Promise<InviteOperationResult<undefined>> {
  try {
    await navigator.clipboard.writeText(url);
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn('Invite link copy failed', error);
    return { ok: false, error: 'Could not copy the invite link.' };
  }
}

export function useGroupInvites(groupId: string) {
  const [invites, setInvites] = useState<GroupInviteView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const createInFlight = useRef(false);
  const deleteInFlight = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    void apiClient.groups
      .getInvites(groupId)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setLoadError(
            getGroupPermissionError(
              result.error,
              'You do not have permission to view invites for this group.',
              'Could not load invites. Please try again.'
            )
          );
          return;
        }
        setInvites(sortInvites(result.data.map(normalizeGroupInvite)));
      })
      .catch((error) => {
        if (cancelled) return;
        logger.error('Invite list failed', error);
        setLoadError(
          getGroupPermissionError(
            error,
            'You do not have permission to view invites for this group.',
            'Could not load invites. Please try again.'
          )
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [groupId, reloadVersion]);

  const reload = useCallback(() => {
    setReloadVersion((version) => version + 1);
  }, []);

  const createInvite = useCallback(
    async (
      options: CreateInviteOptions
    ): Promise<InviteOperationResult<GroupInviteView>> => {
      if (createInFlight.current) {
        return { ok: false, error: 'An invite link is already being created.' };
      }

      createInFlight.current = true;
      setIsCreating(true);
      try {
        const result = await apiClient.groups.createInvite(groupId, {
          ...(options.expirationSeconds === null
            ? {}
            : { expires_in: options.expirationSeconds }),
          ...(options.maxUses === null ? {} : { max_uses: options.maxUses }),
        });
        if (!result.ok) {
          return {
            ok: false,
            error: getGroupPermissionError(
              result.error,
              'You do not have permission to create invites for this group.',
              'Could not create the invite link. Please try again.'
            ),
          };
        }

        const invite = normalizeGroupInvite(result.data);
        setInvites((current) =>
          sortInvites([invite, ...current.filter((item) => item.id !== invite.id)])
        );
        return { ok: true, data: invite };
      } catch (error) {
        logger.error('Invite creation failed', error);
        return {
          ok: false,
          error: getGroupPermissionError(
            error,
            'You do not have permission to create invites for this group.',
            'Could not create the invite link. Please try again.'
          ),
        };
      } finally {
        createInFlight.current = false;
        setIsCreating(false);
      }
    },
    [groupId]
  );

  const deleteInvite = useCallback(
    async (inviteId: string): Promise<InviteOperationResult<undefined>> => {
      if (deleteInFlight.current) {
        return { ok: false, error: 'Another invite link is already being deleted.' };
      }

      deleteInFlight.current = inviteId;
      setDeletingInviteId(inviteId);
      try {
        const result = await apiClient.groups.deleteInvite(groupId, inviteId);
        if (!result.ok) {
          return {
            ok: false,
            error: getGroupPermissionError(
              result.error,
              'You do not have permission to delete invites for this group.',
              'Could not delete the invite link. Please try again.'
            ),
          };
        }
        setInvites((current) => current.filter((invite) => invite.id !== inviteId));
        return { ok: true, data: undefined };
      } catch (error) {
        logger.error('Invite deletion failed', error);
        return {
          ok: false,
          error: getGroupPermissionError(
            error,
            'You do not have permission to delete invites for this group.',
            'Could not delete the invite link. Please try again.'
          ),
        };
      } finally {
        deleteInFlight.current = null;
        setDeletingInviteId(null);
      }
    },
    [groupId]
  );

  return {
    invites,
    isLoading,
    loadError,
    isCreating,
    deletingInviteId,
    reload,
    createInvite,
    deleteInvite,
  };
}
