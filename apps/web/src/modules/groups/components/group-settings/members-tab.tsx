import { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import { apiClient, http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { MembersTabProps } from './types';

const logger = createLogger('MembersTab');
import {
  MemberSearchBar,
  MemberListItem,
  ConfirmActionModal,
  RoleAssignmentModal,
} from './members-tab/index';
import type { GroupMember, GroupRole, MemberAction } from './members-tab/index';
import { FADE_UP } from '@/lib/animations/transitions';
import { getGroupPermissionError } from '../../permission-errors';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Members Tab component.
 */
export function MembersTab({ groupId }: MembersTabProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ memberId: string; action: MemberAction }>({
    memberId: '',
    action: 'none',
  });
  const [banDuration, setBanDuration] = useState('permanent');
  const [reason, setReason] = useState('');
  const [availableRoles, setAvailableRoles] = useState<GroupRole[]>([]);
  const [roleModalMemberId, setRoleModalMemberId] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await http.get(`/api/v1/groups/${groupId}/members`, { params });
      const data = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setMembers(
        data.map((m: Record<string, unknown>) => {
          const mUser: Record<string, unknown> =
            m.user instanceof Object ? Object.fromEntries(Object.entries(m.user)) : {};
          const rawDisplayName = m.display_name ?? m.displayName ?? mUser.display_name ?? null;
          const rawAvatarUrl = m.avatar_url ?? m.avatarUrl ?? mUser.avatar_url ?? null;
          const rawMutedUntil = m.muted_until ?? m.mutedUntil ?? null;
          const mutedUntil = typeof rawMutedUntil === 'string' ? rawMutedUntil : null;
          const mutedUntilTime = mutedUntil ? Date.parse(mutedUntil) : Number.NaN;
          const hasActiveMutedUntil = Number.isFinite(mutedUntilTime) && mutedUntilTime > Date.now();
          const rawRoles: Array<{ id: string; name: string; color: string }> = Array.isArray(
            m.roles
          )
            ? m.roles.map((r: unknown) => {
                const rr: Record<string, unknown> =
                  r instanceof Object ? Object.fromEntries(Object.entries(r)) : {};
                return {
                  id: String(rr.id ?? ''),
                  name: String(rr.name ?? ''),
                  color: String(rr.color ?? '#808080'),
                };
              })
            : [];
          return {
            id: String(m.id ?? ''),
            userId: String(m.user_id ?? m.userId ?? m.id ?? ''),
            username: String(m.username ?? mUser.username ?? 'unknown'),
            displayName: typeof rawDisplayName === 'string' ? rawDisplayName : null,
            avatarUrl: typeof rawAvatarUrl === 'string' ? rawAvatarUrl : null,
            role: String(m.role ?? 'member'),
            roles: rawRoles,
            joinedAt: String(m.joined_at ?? m.joinedAt ?? m.inserted_at ?? ''),
            isMuted: Boolean(m.is_muted ?? m.isMuted ?? hasActiveMutedUntil),
            mutedUntil,
          };
        })
      );
      setErrorMessage(null);
    } catch (error) {
      logger.error('Failed to fetch members', error);
      setErrorMessage(
        getGroupPermissionError(
          error,
          'You do not have permission to view members in this group.',
          'Could not load members. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [groupId, roleFilter]);

  useEffect(() => {
    fetchMembers();
    http
      .get(`/api/v1/groups/${groupId}/roles`)
      .then((res: { data?: unknown }) => {
        const resData = res.data;
        const inner = isRecord(resData) && 'data' in resData ? resData.data : resData;
        const roles = Array.isArray(inner) ? inner : [];
        setAvailableRoles(
          roles.map((role) => {
            const record = isRecord(role) ? role : {};
            return {
              id: String(record.id ?? ''),
              name: String(record.name ?? ''),
              color: String(record.color ?? '#808080'),
              position: Number(record.position ?? 0),
            };
          })
        );
      })
      .catch((error: unknown) => {
        logger.error('Failed to fetch roles', error);
        setErrorMessage(
          getGroupPermissionError(
            error,
            'You do not have permission to view roles in this group.',
            'Could not load roles. Please try again.'
          )
        );
      });
  }, [fetchMembers, groupId]);

  const handleKick = async (memberId: string) => {
    setErrorMessage(null);
    try {
      const result = await apiClient.groups.kickMember(groupId, memberId);
      if (!result.ok) throw result.error;
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) {
      logger.error('Failed to kick member', error);
      setErrorMessage(
        getGroupPermissionError(
          error,
          'You do not have permission to kick members from this group.',
          'Could not kick member. Please try again.'
        )
      );
    }
    setConfirmAction({ memberId: '', action: 'none' });
  };

  const handleBan = async (memberId: string) => {
    setErrorMessage(null);
    try {
      const params: Record<string, string> = {};
      if (banDuration !== 'permanent') params.duration = banDuration;
      await http.post(`/api/v1/groups/${groupId}/members/${memberId}/ban`, params);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) {
      logger.error('Failed to ban member', error);
      setErrorMessage(
        getGroupPermissionError(
          error,
          'You do not have permission to ban members from this group.',
          'Could not ban member. Please try again.'
        )
      );
    }
    setConfirmAction({ memberId: '', action: 'none' });
    setBanDuration('permanent');
  };

  const handleMute = async (memberId: string) => {
    setErrorMessage(null);
    try {
      await http.post(`/api/v1/groups/${groupId}/members/${memberId}/mute`);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, isMuted: true } : m)));
    } catch (error) {
      logger.error('Failed to mute member', error);
      setErrorMessage(
        getGroupPermissionError(
          error,
          'You do not have permission to mute members in this group.',
          'Could not mute member. Please try again.'
        )
      );
    }
    setConfirmAction({ memberId: '', action: 'none' });
  };

  const handleUnmute = async (memberId: string) => {
    setErrorMessage(null);
    try {
      await http.delete(`/api/v1/groups/${groupId}/members/${memberId}/mute`);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, isMuted: false, mutedUntil: null } : m))
      );
    } catch (error) {
      logger.error('Failed to unmute member', error);
      setErrorMessage(
        getGroupPermissionError(
          error,
          'You do not have permission to unmute members in this group.',
          'Could not unmute member. Please try again.'
        )
      );
    }
  };

  const handleConfirmAction = (memberId: string, action: MemberAction) => {
    if (action === 'kick') handleKick(memberId);
    else if (action === 'ban') handleBan(memberId);
    else if (action === 'mute') handleMute(memberId);
  };

  const handleOpenRoleModal = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    setSelectedRoleIds(new Set(member?.roles.map((r) => r.id) ?? []));
    setRoleModalMemberId(memberId);
  };

  const handleToggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handleSaveRoles = async () => {
    if (!roleModalMemberId) return;
    setErrorMessage(null);
    try {
      await http.put(`/api/v1/groups/${groupId}/members/${roleModalMemberId}/roles`, {
        role_ids: Array.from(selectedRoleIds),
      });
      fetchMembers();
      setRoleModalMemberId(null);
    } catch (error) {
      logger.error('Failed to save member roles', error);
      setErrorMessage(
        getGroupPermissionError(
          error,
          'You do not have permission to update member roles in this group.',
          'Could not save member roles. Please try again.'
        )
      );
    }
  };

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.username.toLowerCase().includes(q) || (m.displayName?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} className="max-w-3xl space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Members</h2>
        <p className="text-gray-400">
          Manage group members, roles, and moderation. {members.length} member
          {members.length !== 1 ? 's' : ''}
        </p>
      </div>

      <MemberSearchBar
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {errorMessage}
        </div>
      )}

      <GlassCard variant="frosted" className="divide-y divide-gray-700/50">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search ? 'No members match your search.' : 'No members found.'}
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((member, index) => (
              <MemberListItem
                key={member.id}
                member={member}
                index={index}
                isMenuOpen={openMenuId === member.id}
                onToggleMenu={setOpenMenuId}
                onAction={(id, action) => setConfirmAction({ memberId: id, action })}
                onOpenRoleModal={handleOpenRoleModal}
                onUnmute={handleUnmute}
              />
            ))}
          </AnimatePresence>
        )}
      </GlassCard>

      <ConfirmActionModal
        action={confirmAction.action}
        memberId={confirmAction.memberId}
        banDuration={banDuration}
        reason={reason}
        onBanDurationChange={setBanDuration}
        onReasonChange={setReason}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmAction({ memberId: '', action: 'none' })}
      />

      <RoleAssignmentModal
        memberId={roleModalMemberId}
        members={members}
        availableRoles={availableRoles}
        selectedRoleIds={selectedRoleIds}
        onToggleRole={handleToggleRole}
        onSave={handleSaveRoles}
        onClose={() => setRoleModalMemberId(null)}
      />
    </motion.div>
  );
}
