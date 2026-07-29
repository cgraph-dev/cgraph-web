import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { getGroupPermissionError } from '../../permission-errors';
import type { MembersTabProps } from './types';
import {
  ConfirmActionModal,
  MemberListItem,
  MemberSearchBar,
  RoleAssignmentModal,
} from './members-tab/index';
import type {
  GroupMember,
  GroupRole,
  MemberAction,
  MemberCapabilities,
} from './members-tab/index';

const logger = createLogger('MembersTab');
const MEMBER_PAGE_SIZE = 100;
const DEFAULT_MUTE_SECONDS = 600;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeRole(value: unknown): GroupRole {
  const role = isRecord(value) ? value : {};
  return {
    id: String(role.id ?? ''),
    name: String(role.name ?? ''),
    color: typeof role.color === 'string' ? role.color : '',
    position: Number(role.position ?? 0),
    isDefault: role.is_default === true || role.isDefault === true,
  };
}

function normalizeMember(value: unknown): GroupMember {
  const member = isRecord(value) ? value : {};
  const user = isRecord(member.user) ? member.user : {};
  const mutedUntil =
    typeof (member.muted_until ?? member.mutedUntil) === 'string'
      ? String(member.muted_until ?? member.mutedUntil)
      : null;
  const mutedUntilTime = mutedUntil ? Date.parse(mutedUntil) : Number.NaN;

  return {
    id: String(member.id ?? ''),
    userId: String(member.user_id ?? member.userId ?? user.id ?? ''),
    username: String(member.username ?? user.username ?? 'unknown'),
    displayName:
      typeof (member.display_name ?? member.displayName ?? user.display_name ?? user.displayName) ===
      'string'
        ? String(member.display_name ?? member.displayName ?? user.display_name ?? user.displayName)
        : null,
    avatarUrl:
      typeof (member.avatar_url ?? member.avatarUrl ?? user.avatar_url ?? user.avatarUrl) === 'string'
        ? String(member.avatar_url ?? member.avatarUrl ?? user.avatar_url ?? user.avatarUrl)
        : null,
    roles: Array.isArray(member.roles) ? member.roles.map(normalizeRole) : [],
    joinedAt: String(member.joined_at ?? member.joinedAt ?? member.inserted_at ?? ''),
    isMuted:
      member.is_muted === true ||
      member.isMuted === true ||
      (Number.isFinite(mutedUntilTime) && mutedUntilTime > Date.now()),
    mutedUntil,
  };
}

function highestRolePosition(member: GroupMember | null | undefined): number {
  return Math.max(0, ...(member?.roles.map((role) => role.position) ?? []));
}

function memberFromResponse(value: unknown): GroupMember | null {
  const body = isRecord(value) && 'data' in value ? value.data : value;
  const member = normalizeMember(body);
  return member.id && member.userId ? member : null;
}

function mergeMemberPages(current: GroupMember[], incoming: GroupMember[]): GroupMember[] {
  const merged = new Map(current.map((member) => [member.id, member]));
  incoming.forEach((member) => merged.set(member.id, member));
  return Array.from(merged.values());
}

function sameIds(left: ReadonlySet<string>, right: readonly string[]): boolean {
  return left.size === right.length && right.every((id) => left.has(id));
}

export function MembersTab({ group, permissions }: MembersTabProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ memberId: string; action: MemberAction }>({
    memberId: '',
    action: 'none',
  });
  const [banDuration, setBanDuration] = useState('permanent');
  const [reason, setReason] = useState('');
  const [roleModalMemberId, setRoleModalMemberId] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const availableRoles = useMemo(
    () =>
      group.roles.map((role) => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position,
        isDefault: role.isDefault,
      })),
    [group.roles]
  );
  const currentUserId = group.myMember?.userId ?? '';
  const actorPosition = highestRolePosition(
    group.myMember
      ? {
          id: group.myMember.id,
          userId: group.myMember.userId,
          username: group.myMember.user.username,
          displayName: group.myMember.user.displayName,
          avatarUrl: group.myMember.user.avatarUrl,
          roles: group.myMember.roles.map((role) => ({
            id: role.id,
            name: role.name,
            color: role.color,
            position: role.position,
            isDefault: role.isDefault,
          })),
          joinedAt: group.myMember.joinedAt,
          isMuted: false,
          mutedUntil: null,
        }
      : null
  );

  const fetchMembers = useCallback(
    async ({ cursor = null, append = false }: { cursor?: string | null; append?: boolean } = {}) => {
      const requestId = ++requestSequence.current;
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params: Record<string, string | number> = { limit: MEMBER_PAGE_SIZE };
        if (roleFilter !== 'all') params.role = roleFilter;
        if (cursor) params.cursor = cursor;

        const response = await http.get(`/api/v1/groups/${group.id}/members`, { params });
        if (requestId !== requestSequence.current) return;

        const responseBody = isRecord(response.data) ? response.data : {};
        const data = Array.isArray(responseBody.data)
          ? responseBody.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        const pageInfo = isRecord(responseBody.page_info) ? responseBody.page_info : {};
        const endCursor =
          pageInfo.has_next_page === true && typeof pageInfo.end_cursor === 'string'
            ? pageInfo.end_cursor
            : null;
        const normalized = data.map(normalizeMember);

        setMembers((current) => (append ? mergeMemberPages(current, normalized) : normalized));
        setNextCursor(endCursor);
        setLoadError(null);
      } catch (error) {
        if (requestId !== requestSequence.current) return;
        logger.error('Failed to fetch members', error);
        setLoadError(
          getGroupPermissionError(
            error,
            'You do not have permission to view members in this group.',
            'Could not load members. Please try again.'
          )
        );
      } finally {
        if (requestId === requestSequence.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [group.id, roleFilter]
  );

  useEffect(() => {
    setNextCursor(null);
    void fetchMembers();
  }, [fetchMembers]);

  const closeConfirmation = () => {
    if (pendingMemberId) return;
    setConfirmAction({ memberId: '', action: 'none' });
    setBanDuration('permanent');
    setReason('');
    setActionError(null);
  };

  const openConfirmation = (memberId: string, action: MemberAction) => {
    setActionError(null);
    setConfirmAction({ memberId, action });
  };

  const handleConfirmAction = async (memberId: string, action: MemberAction) => {
    if (action === 'none' || pendingMemberId) return;
    setPendingMemberId(memberId);
    setActionError(null);
    const trimmedReason = reason.trim();

    try {
      if (action === 'kick') {
        await http.delete(`/api/v1/groups/${group.id}/members/${memberId}`, {
          data: trimmedReason ? { reason: trimmedReason } : {},
        });
      } else if (action === 'ban') {
        await http.post(`/api/v1/groups/${group.id}/members/${memberId}/ban`, {
          ...(trimmedReason ? { reason: trimmedReason } : {}),
          ...(banDuration === 'permanent' ? {} : { duration_hours: Number(banDuration) }),
        });
      } else {
        const response = await http.post(`/api/v1/groups/${group.id}/members/${memberId}/mute`, {
          duration: DEFAULT_MUTE_SECONDS,
          ...(trimmedReason ? { reason: trimmedReason } : {}),
        });
        const updatedMember = memberFromResponse(response.data);
        if (updatedMember) {
          setMembers((current) =>
            current.map((member) => (member.id === memberId ? updatedMember : member))
          );
        } else {
          setMembers((current) =>
            current.map((member) =>
              member.id === memberId ? { ...member, isMuted: true } : member
            )
          );
        }
      }

      if (action === 'kick' || action === 'ban') {
        setMembers((current) => current.filter((member) => member.id !== memberId));
      }
      setConfirmAction({ memberId: '', action: 'none' });
      setBanDuration('permanent');
      setReason('');
    } catch (error) {
      logger.error(`Failed to ${action} member`, error);
      const permissionCopy = {
        kick: 'You do not have permission to kick members from this group.',
        ban: 'You do not have permission to ban members from this group.',
        mute: 'You do not have permission to mute members in this group.',
      }[action];
      setActionError(
        getGroupPermissionError(
          error,
          permissionCopy,
          `Could not ${action} member. Please try again.`
        )
      );
    } finally {
      setPendingMemberId(null);
    }
  };

  const handleUnmute = async (memberId: string) => {
    if (pendingMemberId) return;
    setPendingMemberId(memberId);
    setActionError(null);
    try {
      const response = await http.delete(`/api/v1/groups/${group.id}/members/${memberId}/mute`);
      const updatedMember = memberFromResponse(response.data);
      setMembers((current) =>
        current.map((member) =>
          member.id === memberId
            ? (updatedMember ?? { ...member, isMuted: false, mutedUntil: null })
            : member
        )
      );
    } catch (error) {
      logger.error('Failed to unmute member', error);
      setActionError(
        getGroupPermissionError(
          error,
          'You do not have permission to unmute members in this group.',
          'Could not unmute member. Please try again.'
        )
      );
    } finally {
      setPendingMemberId(null);
    }
  };

  const handleOpenRoleModal = (memberId: string) => {
    const member = members.find((candidate) => candidate.id === memberId);
    setSelectedRoleIds(new Set(member?.roles.map((role) => role.id) ?? []));
    setRoleModalMemberId(memberId);
    setActionError(null);
  };

  const handleToggleRole = (roleId: string) => {
    setSelectedRoleIds((current) => {
      const next = new Set(current);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handleSaveRoles = async () => {
    if (!roleModalMemberId || pendingMemberId) return;
    const memberId = roleModalMemberId;
    setPendingMemberId(memberId);
    setActionError(null);

    try {
      const roleIds = availableRoles
        .filter((role) => selectedRoleIds.has(role.id))
        .map((role) => role.id);
      const response = await http.put(`/api/v1/groups/${group.id}/members/${memberId}/roles`, {
        role_ids: roleIds,
      });
      const updatedMember = memberFromResponse(response.data);
      const selectedRoles = availableRoles.filter((role) => roleIds.includes(role.id));
      setMembers((current) =>
        current.map((member) =>
          member.id === memberId ? (updatedMember ?? { ...member, roles: selectedRoles }) : member
        )
      );
      setRoleModalMemberId(null);
    } catch (error) {
      logger.error('Failed to save member roles', error);
      setActionError(
        getGroupPermissionError(
          error,
          'You do not have permission to update member roles in this group.',
          'Could not save member roles. Please try again.'
        )
      );
    } finally {
      setPendingMemberId(null);
    }
  };

  const sortedMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return members
      .filter(
        (member) =>
          !query ||
          member.username.toLocaleLowerCase().includes(query) ||
          member.displayName?.toLocaleLowerCase().includes(query)
      )
      .sort((left, right) => {
        if (left.userId === currentUserId) return -1;
        if (right.userId === currentUserId) return 1;
        if (left.userId === group.ownerId) return -1;
        if (right.userId === group.ownerId) return 1;
        const hierarchy = highestRolePosition(right) - highestRolePosition(left);
        if (hierarchy !== 0) return hierarchy;
        return (left.displayName || left.username).localeCompare(right.displayName || right.username);
      });
  }, [currentUserId, group.ownerId, members, search]);

  const capabilitiesFor = (member: GroupMember): MemberCapabilities => {
    const targetIsProtected =
      member.userId === currentUserId ||
      member.userId === group.ownerId ||
      (group.ownerId !== currentUserId && actorPosition <= highestRolePosition(member));
    if (targetIsProtected) {
      return { canManageRoles: false, canKick: false, canBan: false, canMute: false };
    }
    return {
      canManageRoles: permissions.canManageRoles,
      canKick: permissions.canKickMembers,
      canBan: permissions.canBanMembers,
      canMute: permissions.canMuteMembers,
    };
  };

  const assignableRoles =
    group.ownerId === currentUserId
      ? availableRoles.filter((role) => !role.isDefault)
      : availableRoles.filter((role) => !role.isDefault && role.position < actorPosition);
  const roleModalMember = members.find((member) => member.id === roleModalMemberId);
  const roleSelectionChanged = roleModalMember
    ? !sameIds(selectedRoleIds, roleModalMember.roles.map((role) => role.id))
    : false;

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h2 className="mb-2 text-2xl font-bold text-[var(--token-text-primary)]">Members</h2>
        <p className="text-[var(--token-text-muted)]">
          Manage group members, roles, and moderation. {members.length} loaded
        </p>
      </header>

      <MemberSearchBar
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        roles={availableRoles}
      />

      {actionError && confirmAction.action === 'none' && roleModalMemberId === null && (
        <p
          role="alert"
          className="cgraph-section-surface border-[var(--token-feedback-error)] px-4 py-3 text-sm text-[var(--token-feedback-error)]"
        >
          {actionError}
        </p>
      )}

      <Card padding="none" className="overflow-visible">
        {loading ? (
          <MemberListSkeleton />
        ) : loadError && members.length === 0 ? (
          <div className="space-y-4 p-6 text-center">
            <p role="alert" className="text-sm text-[var(--token-feedback-error)]">
              {loadError}
            </p>
            <Button variant="secondary" size="sm" onClick={() => void fetchMembers()}>
              Retry
            </Button>
          </div>
        ) : sortedMembers.length === 0 ? (
          <EmptyState
            title={search ? 'No matching members' : 'No members found'}
            message={
              search ? 'Try another name or username.' : 'Members will appear here after they join.'
            }
            icon={<UsersIcon className="h-7 w-7" />}
            className="min-h-56"
          />
        ) : (
          <div>
            {loadError && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--token-border-muted)] px-4 py-3">
                <p role="alert" className="text-sm text-[var(--token-feedback-error)]">
                  {loadError}
                </p>
                <Button variant="secondary" size="sm" onClick={() => void fetchMembers()}>
                  Retry
                </Button>
              </div>
            )}
            <ul aria-label="Group members" className="divide-y divide-[var(--token-border-muted)]">
              {sortedMembers.map((member) => (
                <MemberListItem
                  key={member.id}
                  member={member}
                  isOwner={member.userId === group.ownerId}
                  isCurrentUser={member.userId === currentUserId}
                  capabilities={capabilitiesFor(member)}
                  isMenuOpen={openMenuId === member.id}
                  isPending={pendingMemberId !== null}
                  onToggleMenu={setOpenMenuId}
                  onAction={openConfirmation}
                  onOpenRoleModal={handleOpenRoleModal}
                  onUnmute={handleUnmute}
                />
              ))}
            </ul>
          </div>
        )}
      </Card>

      {nextCursor && !loading && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            isLoading={loadingMore}
            onClick={() => fetchMembers({ cursor: nextCursor, append: true })}
          >
            Load more members
          </Button>
        </div>
      )}

      <ConfirmActionModal
        action={confirmAction.action}
        memberId={confirmAction.memberId}
        banDuration={banDuration}
        reason={reason}
        error={confirmAction.action === 'none' ? null : actionError}
        isSubmitting={pendingMemberId === confirmAction.memberId}
        onBanDurationChange={setBanDuration}
        onReasonChange={setReason}
        onConfirm={handleConfirmAction}
        onClose={closeConfirmation}
      />

      <RoleAssignmentModal
        memberId={roleModalMemberId}
        members={members}
        availableRoles={assignableRoles}
        selectedRoleIds={selectedRoleIds}
        error={roleModalMemberId ? actionError : null}
        canSave={roleSelectionChanged}
        isSubmitting={pendingMemberId === roleModalMemberId}
        onToggleRole={handleToggleRole}
        onSave={handleSaveRoles}
        onClose={() => {
          if (pendingMemberId) return;
          setRoleModalMemberId(null);
          setActionError(null);
        }}
      />
    </div>
  );
}

function MemberListSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading group members" className="space-y-1 p-4">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex min-h-16 items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="24%" />
          </div>
        </div>
      ))}
    </div>
  );
}
