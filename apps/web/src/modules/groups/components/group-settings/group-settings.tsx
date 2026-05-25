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

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
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
import { FADE_UP } from '@/lib/animations/transitions';

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
    isSaving,
    handleSave,
    saveError,
    handleReset,
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
            return permissions.canManageInvites;
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
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Group not found</p>
      </div>
    );
  }

  if (!effectiveActiveTab) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--token-card-bg)] p-8">
        <div className="max-w-md rounded-2xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-6 text-center">
          <h2 className="text-lg font-bold text-white">Group settings unavailable</h2>
          <p className="mt-2 text-sm text-gray-400">
            You do not have access to manage or personalize this group.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[var(--token-card-bg)]">
      {/* Sidebar */}
      <SettingsSidebar
        group={activeGroup}
        activeTab={effectiveActiveTab}
        onTabChange={setActiveTab}
        tabs={visibleTabs}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {onClose && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close group settings"
              className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {effectiveActiveTab === 'overview' && (
            <OverviewTab
              key="overview"
              group={activeGroup}
              formData={formData}
              onChange={handleFormChange}
              isAdmin={permissions.canManageGroup}
            />
          )}

          {effectiveActiveTab === 'roles' && (
            <motion.div key="roles" {...FADE_UP} exit={{ opacity: 0, y: -20 }} className="h-full">
              <RoleManager groupId={groupId} />
            </motion.div>
          )}

          {effectiveActiveTab === 'members' && <MembersTab key="members" groupId={groupId} />}

          {effectiveActiveTab === 'invites' && (
            <InvitesTab key="invites" groupId={groupId} groupName={activeGroup.name} />
          )}

          {effectiveActiveTab === 'channels' && <ChannelsTab key="channels" groupId={groupId} />}

          {effectiveActiveTab === 'notifications' && (
            <NotificationsTab key="notifications" groupId={groupId} />
          )}

          {effectiveActiveTab === 'audit-log' && <AuditLogTab key="audit-log" groupId={groupId} />}

          {effectiveActiveTab === 'automod' && <AutomodTab key="automod" groupId={groupId} />}

          {effectiveActiveTab === 'danger' && (
            <DangerTab
              key="danger"
              isOwner={isOwner}
              onLeave={() => setShowLeaveConfirm(true)}
              onDelete={() => setShowDeleteConfirm(true)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Save Bar */}
      <SaveBar
        hasChanges={permissions.canManageGroup && hasChanges}
        isSaving={isSaving}
        errorMessage={saveError}
        onSave={handleSave}
        onReset={handleReset}
      />

      {/* Leave Confirmation */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}

export default GroupSettings;
