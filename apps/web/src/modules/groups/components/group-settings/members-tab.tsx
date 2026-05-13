import { useState, useEffect } from 'react';
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

  const fetchMembers = async () => {
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
            isMuted: !!(m.is_muted ?? m.isMuted),
            mutedUntil: typeof rawMutedUntil === 'string' ? rawMutedUntil : null,
          };
        })
      );
    } catch (error) {
      logger.error('Failed to fetch members', error);
    } finally {
      setLoading(false);
    }
  };

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
      });
  }, [fetchMembers, groupId]);

  const handleKick = async (memberId: string) => {
    try {
      const result = await apiClient.groups.kickMember(groupId, memberId);
      if (!result.ok) throw new Error(result.error.message);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) {
      logger.error('Failed to kick member', error);
    }
    setConfirmAction({ memberId: '', action: 'none' });
  };

  const handleBan = async (memberId: string) => {
    try {
      const params: Record<string, string> = {};
      if (banDuration !== 'permanent') params.duration = banDuration;
      await http.post(`/api/v1/groups/${groupId}/members/${memberId}/ban`, params);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) {
      logger.error('Failed to ban member', error);
    }
    setConfirmAction({ memberId: '', action: 'none' });
    setBanDuration('permanent');
  };

  const handleMute = async (memberId: string) => {
    try {
      await http.post(`/api/v1/groups/${groupId}/members/${memberId}/mute`);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, isMuted: true } : m)));
    } catch (error) {
      logger.error('Failed to mute member', error);
    }
    setConfirmAction({ memberId: '', action: 'none' });
  };

  const handleUnmute = async (memberId: string) => {
    try {
      await http.delete(`/api/v1/groups/${groupId}/members/${memberId}/mute`);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, isMuted: false, mutedUntil: null } : m))
      );
    } catch (error) {
      logger.error('Failed to unmute member', error);
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
    try {
      await http.put(`/api/v1/groups/${groupId}/members/${roleModalMemberId}/roles`, {
        role_ids: Array.from(selectedRoleIds),
      });
      fetchMembers();
    } catch (error) {
      logger.error('Failed to save member roles', error);
    }
    setRoleModalMemberId(null);
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
