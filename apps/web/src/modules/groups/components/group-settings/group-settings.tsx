/**
 * GroupSettings Component
 *
 * Comprehensive group settings interface.
 * Features:
 * - Overview settings (name, description, icon, banner)
 * - Role management
 * - Channel management
 * - Moderation settings
 * - Invite management
 * - Danger zone (leave/delete)
 *
 */

import { useEffect, useMemo } from 'react';
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { IconButton } from '@/components/ui/button';
import { RoleManager } from '../role-manager';
import type { GroupSettingsProps } from './types';
import { useGroupSettings } from './useGroupSettings';
import { SettingsSidebar } from './settings-sidebar';
import { OverviewTab } from './overview-tab';
import { MembersTab } from './members-tab';
import { InvitesTab } from './invites-tab';
import { ChannelsTab } from './channels-tab';
import { NotificationsTab } from './notifications-tab';
import { AuditLogTab } from './audit-log-tab';
import { AutomodTab } from './automod-tab';
import { DangerTab } from './danger-tab';
import { ConfirmModal } from './confirm-modal';
import { SaveBar } from './save-bar';
import { SETTINGS_TABS } from './constants';

/**
 * Group Settings component.
 */
export function GroupSettings({ groupId, onClose }: GroupSettingsProps) {
  const {
    activeGroup,
    activeTab,
    setActiveTab,
    isOwner,
    permissions,
    formData,
    handleFormChange,
    hasChanges,
    canSave,
    isSaving,
    handleSave,
    saveError,
    handleReset,
    dangerError,
    showLeaveConfirm,
    setShowLeaveConfirm,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleLeave,
    handleDelete,
  } = useGroupSettings(groupId);

  const visibleTabs = useMemo(
    () =>
      SETTINGS_TABS.filter((tab) => {
        switch (tab.id) {
          case 'overview':
            return permissions.canManageGroup;
          case 'roles':
            return permissions.canManageRoles;
          case 'members':
            return permissions.canManageMembers;
          case 'invites':
            return permissions.canCreateInvites;
          case 'channels':
            return permissions.canManageChannels;
          case 'audit-log':
            return permissions.canViewAuditLog;
          case 'automod':
            return permissions.canManageAutomod;
          case 'notifications':
          case 'danger':
            return true;
          default:
            return false;
        }
      }),
    [permissions]
  );
  const visibleTabIds = visibleTabs.map((tab) => tab.id);
  const effectiveActiveTab =
    !activeGroup || visibleTabIds.includes(activeTab) ? activeTab : visibleTabs[0]?.id;

  useEffect(() => {
    if (activeGroup && effectiveActiveTab && effectiveActiveTab !== activeTab) {
      setActiveTab(effectiveActiveTab);
    }
  }, [activeGroup, activeTab, effectiveActiveTab, setActiveTab]);

  if (!activeGroup) {
    return (
      <div className="cgraph-workspace flex h-full items-center justify-center p-6">
        <div className="cgraph-empty-state">
          <div className="cgraph-empty-icon">
            <Cog6ToothIcon className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--token-text-primary)]">Group not found</h2>
          <p className="mt-1 text-sm text-[var(--token-text-muted)]">
            This group is unavailable or you no longer have access.
          </p>
        </div>
      </div>
    );
  }

  if (!effectiveActiveTab) {
    return (
      <div className="cgraph-workspace flex h-full items-center justify-center p-8">
        <div className="cgraph-empty-state max-w-md">
          <div className="cgraph-empty-icon">
            <Cog6ToothIcon className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--token-text-primary)]">
            Group settings unavailable
          </h2>
          <p className="mt-2 text-sm text-[var(--token-text-muted)]">
            You do not have access to manage or personalize this group.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cgraph-workspace flex h-full min-w-0 flex-col lg:flex-row">
      <SettingsSidebar
        group={activeGroup}
        activeTab={effectiveActiveTab}
        onTabChange={setActiveTab}
        tabs={visibleTabs}
      />

      <div className="cgraph-content min-w-0 flex-1 overflow-y-auto pb-24">
        {onClose && (
          <div className="mb-4 flex justify-end">
            <IconButton
              icon={<XMarkIcon />}
              label="Close group settings"
              onClick={onClose}
            />
          </div>
        )}

        {effectiveActiveTab === 'overview' && (
          <OverviewTab
            group={activeGroup}
            formData={formData}
            onChange={handleFormChange}
            isAdmin={permissions.canManageGroup}
          />
        )}

        {effectiveActiveTab === 'roles' && <RoleManager groupId={groupId} />}

        {effectiveActiveTab === 'members' && (
          <MembersTab group={activeGroup} permissions={permissions} />
        )}

        {effectiveActiveTab === 'invites' && (
          <InvitesTab
            groupId={groupId}
            groupName={activeGroup.name}
            canCreateInvites={permissions.canCreateInvites}
            canDeleteInvites={permissions.canDeleteInvites}
          />
        )}

        {effectiveActiveTab === 'channels' && <ChannelsTab groupId={groupId} />}

        {effectiveActiveTab === 'notifications' && <NotificationsTab groupId={groupId} />}

        {effectiveActiveTab === 'audit-log' && <AuditLogTab groupId={groupId} />}

        {effectiveActiveTab === 'automod' && <AutomodTab groupId={groupId} />}

        {effectiveActiveTab === 'danger' && (
          <DangerTab
            isOwner={isOwner}
            errorMessage={dangerError}
            onLeave={() => setShowLeaveConfirm(true)}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        )}
      </div>

      <SaveBar
        hasChanges={permissions.canManageGroup && hasChanges}
        canSave={canSave}
        isSaving={isSaving}
        errorMessage={saveError}
        onSave={handleSave}
        onReset={handleReset}
      />

      {showLeaveConfirm && (
        <ConfirmModal
          title="Leave Group"
          message={`Are you sure you want to leave ${activeGroup.name}? You'll need an invite to rejoin.`}
          confirmLabel="Leave"
          danger
          onConfirm={handleLeave}
          onClose={() => setShowLeaveConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Group"
          message={`Are you sure you want to delete ${activeGroup.name}? This action cannot be undone and all data will be lost.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

export default GroupSettings;
