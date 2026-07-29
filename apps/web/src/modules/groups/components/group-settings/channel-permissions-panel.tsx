import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';
import { asString, asNumber, asOptionalString } from '@/lib/api-utils';
import { createLogger } from '@/lib/logger';
import { Button, IconButton } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Skeleton from '@/components/ui/skeleton';
import { getGroupPermissionError } from '../../permission-errors';

const logger = createLogger('ChannelPermissions');

import { AddOverrideForm } from './channel-permissions/add-override-form';
import { OverwriteCard } from './channel-permissions/overwrite-card';
import {
  getPermState,
  cyclePermState,
  applyPermChange,
} from './channel-permissions/permission-utils';
import type {
  PermissionOverwrite,
  RoleOption,
  ChannelPermissionsPanelProps,
} from './channel-permissions/types';

export type { ChannelPermissionsPanelProps } from './channel-permissions/types';

export function ChannelPermissionsPanel({
  groupId,
  channelId,
  channelName,
  onClose,
}: ChannelPermissionsPanelProps) {
  const [overwrites, setOverwrites] = useState<PermissionOverwrite[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationKey, setMutationKey] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'role' | 'member'>('role');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, { allow: number; deny: number }>
  >({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [permsRes, rolesRes] = await Promise.all([
        http.get(`/api/v1/groups/${groupId}/channels/${channelId}/permissions`),
        http.get(`/api/v1/groups/${groupId}/roles`),
      ]);

      const permsData = permsRes.data?.data ?? permsRes.data ?? [];
      setOverwrites(
        Array.isArray(permsData)
          ? permsData.map((o: Record<string, unknown>) => ({
              id: asString(o.id),
              type: asString(o.type, 'role') === 'member' ? ('member' as const) : ('role' as const),
              roleId: asOptionalString(o.role_id) ?? asOptionalString(o.roleId) ?? null,
              memberId: asOptionalString(o.member_id) ?? asOptionalString(o.memberId) ?? null,
              roleName: asOptionalString(o.role_name) ?? asOptionalString(o.roleName),
              memberName: asOptionalString(o.member_name) ?? asOptionalString(o.memberName),
              allow: asNumber(o.allow),
              deny: asNumber(o.deny),
            }))
          : []
      );

      const rolesData = rolesRes.data?.data ?? rolesRes.data ?? [];
      setRoles(
        Array.isArray(rolesData)
          ? rolesData.map((r: Record<string, unknown>) => ({
              id: asString(r.id),
              name: asString(r.name),
              color: asString(r.color),
            }))
          : []
      );
    } catch (error) {
      logger.error('Failed to fetch channel permissions and roles', error);
      setLoadError('Could not load channel permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [channelId, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!selectedTargetId || mutationKey) return;
    setMutationKey('add');
    setMutationError(null);
    try {
      await http.post(`/api/v1/groups/${groupId}/channels/${channelId}/permissions`, {
        type: addType,
        role_id: addType === 'role' ? selectedTargetId : undefined,
        member_id: addType === 'member' ? selectedTargetId : undefined,
        allow: 0,
        deny: 0,
      });
      setShowAddForm(false);
      setSelectedTargetId('');
      await fetchData();
    } catch (error) {
      logger.error('Failed to add permission override', error);
      setMutationError(
        getGroupPermissionError(
          error,
          'You do not have permission to add channel overrides.',
          'Could not add the channel override. Please try again.'
        )
      );
    } finally {
      setMutationKey(null);
    }
  };

  const handleSave = async (overwriteId: string) => {
    const changes = pendingChanges[overwriteId];
    if (!changes || mutationKey) return;
    setMutationKey(`save:${overwriteId}`);
    setMutationError(null);
    try {
      await http.put(`/api/v1/groups/${groupId}/channels/${channelId}/permissions/${overwriteId}`, {
        allow: changes.allow,
        deny: changes.deny,
      });
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[overwriteId];
        return next;
      });
      setEditingId(null);
      await fetchData();
    } catch (error) {
      logger.error('Failed to save permission overwrite', error);
      setMutationError(
        getGroupPermissionError(
          error,
          'You do not have permission to update channel overrides.',
          'Could not save the channel override. Please try again.'
        )
      );
    } finally {
      setMutationKey(null);
    }
  };

  const handleDelete = async (overwriteId: string) => {
    if (mutationKey) return;
    setMutationKey(`delete:${overwriteId}`);
    setMutationError(null);
    try {
      await http.delete(
        `/api/v1/groups/${groupId}/channels/${channelId}/permissions/${overwriteId}`
      );
      setOverwrites((prev) => prev.filter((o) => o.id !== overwriteId));
    } catch (error) {
      logger.error('Failed to delete permission overwrite', error);
      setMutationError(
        getGroupPermissionError(
          error,
          'You do not have permission to remove channel overrides.',
          'Could not remove the channel override. Please try again.'
        )
      );
    } finally {
      setMutationKey(null);
    }
  };

  const handlePermToggle = (overwriteId: string, bit: number) => {
    const overwrite = overwrites.find((o) => o.id === overwriteId);
    if (!overwrite) return;

    const current = pendingChanges[overwriteId] ?? {
      allow: overwrite.allow,
      deny: overwrite.deny,
    };
    const state = getPermState(current.allow, current.deny, bit);
    const newState = cyclePermState(state);
    const updated = applyPermChange(current.allow, current.deny, bit, newState);

    setPendingChanges((prev) => ({ ...prev, [overwriteId]: updated }));
  };

  const availableRoles = roles.filter(
    (r) => !overwrites.some((o) => o.type === 'role' && o.roleId === r.id)
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ariaLabel="Channel Permissions"
        className="max-h-[85dvh] !max-w-2xl overflow-hidden p-0"
      >
        <DialogHeader className="mb-0 flex items-center justify-between border-b border-[var(--token-card-border)] px-6 py-4">
          <div>
            <DialogTitle>Channel Permissions</DialogTitle>
            <p className="text-sm text-[var(--token-text-muted)]">#{channelName}</p>
          </div>
          <IconButton icon={<XMarkIcon />} label="Close channel permissions" onClick={onClose} />
        </DialogHeader>

        <div className="max-h-[calc(85dvh-78px)] overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3" aria-label="Loading channel permissions" role="status">
              <Skeleton variant="rectangular" height={44} />
              <Skeleton variant="rectangular" height={96} />
              <Skeleton variant="rectangular" height={96} />
            </div>
          ) : loadError ? (
            <div className="cgraph-section-surface px-4 py-5 text-center" role="alert">
              <p className="text-sm text-[var(--token-feedback-error)]">{loadError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mutationError && (
                <div
                  role="alert"
                  className="cgraph-section-surface border-[var(--token-feedback-error)] px-4 py-3 text-sm text-[var(--token-feedback-error)]"
                >
                  {mutationError}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  size="sm"
                  leftIcon={<PlusIcon aria-hidden="true" />}
                  disabled={mutationKey !== null}
                  onClick={() => setShowAddForm(true)}
                  aria-expanded={showAddForm}
                >
                  Add Override
                </Button>
              </div>

              <AddOverrideForm
                show={showAddForm}
                addType={addType}
                selectedTargetId={selectedTargetId}
                availableRoles={availableRoles}
                onTypeChange={setAddType}
                onTargetChange={setSelectedTargetId}
                onAdd={handleAdd}
                onCancel={() => {
                  setShowAddForm(false);
                  setSelectedTargetId('');
                }}
                disabled={mutationKey !== null}
              />

              {overwrites.length === 0 ? (
                <div className="py-8 text-center text-sm text-[var(--token-text-muted)]">
                  No permission overrides. Channel inherits all permissions from roles.
                </div>
              ) : (
                <div className="space-y-3">
                  {overwrites.map((overwrite) => {
                    const changes = pendingChanges[overwrite.id];
                    return (
                      <OverwriteCard
                        key={overwrite.id}
                        overwrite={overwrite}
                        roles={roles}
                        isEditing={editingId === overwrite.id}
                        saving={mutationKey === `save:${overwrite.id}`}
                        deleting={mutationKey === `delete:${overwrite.id}`}
                        disabled={mutationKey !== null}
                        pendingAllow={changes?.allow ?? overwrite.allow}
                        pendingDeny={changes?.deny ?? overwrite.deny}
                        hasPendingChanges={!!changes}
                        onToggleEdit={() =>
                          setEditingId(editingId === overwrite.id ? null : overwrite.id)
                        }
                        onDelete={() => handleDelete(overwrite.id)}
                        onPermToggle={(bit) => handlePermToggle(overwrite.id, bit)}
                        onSave={() => handleSave(overwrite.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
