import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRightIcon, ExclamationTriangleIcon, TicketIcon } from '@heroicons/react/24/outline';
import type { GroupInvite } from '@cgraph-dev/api-client';
import { apiClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getGroupRoute } from '@/modules/groups/routing';
import { useGroupStore } from '@/modules/groups/store';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';

const logger = createLogger('GroupInviteLanding');

interface InvitePreview {
  readonly groupName: string;
  readonly groupAvatar: string | null;
  readonly creatorUsername: string | null;
  readonly uses: number;
  readonly maxUses: number | null;
  readonly expiresAt: string | null;
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

function normalizeInvitePreview(invite: GroupInvite): InvitePreview {
  const inviteRecord = readRecord(invite) ?? {};
  const group = readRecord(inviteRecord.group);
  const creator = readRecord(inviteRecord.creator);

  return {
    groupName:
      readString(inviteRecord.group_name) ??
      readString(inviteRecord.groupName) ??
      readString(group?.name) ??
      'CGraph group',
    groupAvatar:
      firstDefined(
        readNullableString(inviteRecord.group_avatar),
        readNullableString(inviteRecord.groupAvatar),
        readNullableString(group?.icon_url),
        readNullableString(group?.iconUrl)
      ) ?? null,
    creatorUsername:
      readString(inviteRecord.creator_username) ??
      readString(inviteRecord.creatorUsername) ??
      readString(creator?.username) ??
      null,
    uses: readNumber(inviteRecord.uses) ?? 0,
    maxUses:
      firstDefined(
        readNullableNumber(inviteRecord.max_uses),
        readNullableNumber(inviteRecord.maxUses)
      ) ?? null,
    expiresAt:
      firstDefined(
        readNullableString(inviteRecord.expires_at),
        readNullableString(inviteRecord.expiresAt)
      ) ?? null,
  };
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'No expiry';
  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) return 'Expiry unknown';
  if (expires.getTime() <= Date.now()) return 'Expired';
  return `Expires ${expires.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

function decodeInviteCode(code: string): string {
  try {
    return decodeURIComponent(code).trim();
  } catch {
    return code.trim();
  }
}

function getInviteAvailabilityError(preview: InvitePreview | null): string | null {
  if (!preview) return null;
  if (preview.expiresAt) {
    const expires = new Date(preview.expiresAt);
    if (!Number.isNaN(expires.getTime()) && expires.getTime() <= Date.now()) {
      return 'This invite has expired.';
    }
  }
  if (preview.maxUses !== null && preview.uses >= preview.maxUses) {
    return 'This invite has reached its usage limit.';
  }
  return null;
}

/**
 * Renders a generated group invite link and redeems it into the canonical group route.
 */
export default function GroupInviteLanding() {
  const { code = '' } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const joinGroup = useGroupStore((state) => state.joinGroup);
  const normalizedCode = useMemo(() => decodeInviteCode(code), [code]);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const availabilityError = getInviteAvailabilityError(preview);

  useEffect(() => {
    let isMounted = true;

    async function loadInvite() {
      if (!normalizedCode) {
        setIsLoading(false);
        setErrorMessage('This invite link is missing a code.');
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      const result = await apiClient.groups.getInviteInfo(normalizedCode);
      if (!isMounted) return;

      if (!result.ok) {
        setPreview(null);
        setErrorMessage(
          result.error.message || 'This invite is invalid, expired, or has reached its usage limit.'
        );
        setIsLoading(false);
        return;
      }

      setPreview(normalizeInvitePreview(result.data));
      setIsLoading(false);
    }

    void loadInvite().catch((error) => {
      logger.error('Invite preview failed', error);
      if (!isMounted) return;
      setPreview(null);
      setErrorMessage('This invite is invalid, expired, or has reached its usage limit.');
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [normalizedCode]);

  const handleJoin = async () => {
    if (!normalizedCode || isJoining) return;
    setIsJoining(true);
    setErrorMessage(null);
    try {
      const group = await joinGroup(normalizedCode);
      HapticFeedback.success();
      navigate(group ? getGroupRoute(group) : '/groups', { replace: true });
    } catch (error) {
      logger.error('Invite join failed', error);
      setErrorMessage('This invite is invalid, expired, or has reached its usage limit.');
      HapticFeedback.error();
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="cgraph-workspace flex min-h-full items-center justify-center px-4 py-10">
      <section className="cgraph-dialog-content w-full max-w-lg p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--product-line)] bg-[var(--product-surface-recessed)]">
            {preview?.groupAvatar ? (
              <img
                src={preview.groupAvatar}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <TicketIcon className="h-7 w-7 text-[var(--token-interactive-primary)]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="cgraph-eyebrow">Group invite</p>
            <h1 className="truncate text-2xl font-semibold text-[var(--token-text-primary)]">
              {preview?.groupName ?? 'Opening invite'}
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="cgraph-card space-y-3 p-4" aria-label="Checking invite">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : errorMessage ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="cgraph-card p-3" data-cgraph-material="recessed">
                <p className="text-[var(--token-text-muted)]">Uses</p>
                <p className="mt-1 font-semibold text-[var(--token-text-primary)]">
                  {preview?.uses ?? 0}
                  {preview?.maxUses ? ` / ${preview.maxUses}` : ''}
                </p>
              </div>
              <div className="cgraph-card p-3" data-cgraph-material="recessed">
                <p className="text-[var(--token-text-muted)]">Availability</p>
                <p className="mt-1 font-semibold text-[var(--token-text-primary)]">
                  {formatExpiry(preview?.expiresAt ?? null)}
                </p>
              </div>
            </div>
            {preview?.creatorUsername && (
              <p className="text-sm text-[var(--token-text-muted)]">
                Invited by {preview.creatorUsername}
              </p>
            )}
            {availabilityError && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {availabilityError}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Link
            to="/groups"
            className="cgraph-control cgraph-control-secondary flex min-h-10 flex-1 items-center justify-center rounded-md px-4 py-2 text-center text-sm font-medium"
          >
            Back to Groups
          </Link>
          <Button
            type="button"
            onClick={handleJoin}
            isLoading={isJoining}
            disabled={isLoading || !!errorMessage || !!availabilityError || isJoining}
            rightIcon={<ArrowRightIcon />}
            animated={false}
            className="flex-1"
          >
            Join Group
          </Button>
        </div>
      </section>
    </main>
  );
}
