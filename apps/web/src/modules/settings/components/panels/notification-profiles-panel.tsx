/**
 * Notification Profiles list panel.
 *
 * Lists all notification profiles with create/edit/delete, active profile
 * indicator, and manual enable/disable toggle with duration picker.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeftIcon, PlusIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';
import { useNotificationProfileStore } from '@/modules/settings/store/notification-profile-store';
import { NotificationProfilesMenu } from './notification-profiles-menu';
import type { NotificationProfile } from '@cgraph/shared-types';
import { hhmmToDisplayString } from '@cgraph/shared-types';

function getScheduleStatusLabel(profile: NotificationProfile, activeId: string | null): string {
  if (activeId === profile.id) {
    return 'Active';
  }
  if (profile.schedule?.enabled) {
    return 'Scheduled';
  }
  return 'Off';
}

function getScheduleStatusColor(profile: NotificationProfile, activeId: string | null): string {
  if (activeId === profile.id) {
    return 'bg-green-500';
  }
  if (profile.schedule?.enabled) {
    return 'bg-amber-500';
  }
  return 'bg-zinc-500';
}

export function NotificationProfilesPanel(): React.ReactNode {
  const navigate = useNavigate();
  const {
    profiles,
    activeProfile,
    isLoading,
    fetchProfiles,
    fetchActiveProfile,
    deleteProfile,
    activateProfile,
    deactivateProfile,
  } = useNotificationProfileStore();

  const [menuTarget, setMenuTarget] = useState<NotificationProfile | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchProfiles();
    fetchActiveProfile();
  }, [fetchProfiles, fetchActiveProfile]);

  function handleProfileClick(profile: NotificationProfile): void {
    HapticFeedback.light();
    navigate(`/settings/notification-profiles/${profile.id}`);
  }

  function handleContextMenu(e: React.MouseEvent, profile: NotificationProfile): void {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setMenuTarget(profile);
  }

  function handleQuickEnable(durationMinutes: number | null): void {
    if (menuTarget) {
      activateProfile(menuTarget.id, durationMinutes);
      setMenuTarget(null);
    }
  }

  function handleDeactivate(): void {
    deactivateProfile();
    setMenuTarget(null);
  }

  function handleDeleteProfile(profileId: string): void {
    deleteProfile(profileId);
    setMenuTarget(null);
  }

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} transition={tweens.standard}>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => {
            HapticFeedback.light();
            navigate('/settings/notifications');
          }}
          className="aurora-social-button-muted flex h-10 w-10 items-center justify-center rounded-xl text-[var(--token-text-secondary)]"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="bg-gradient-to-r from-[var(--token-text-primary)] via-primary-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
            Notification Profiles
          </h1>
          <p className="text-sm text-[var(--token-text-muted)]">
            Named DND profiles with schedules and exceptions
          </p>
        </div>
      </div>

      {/* Active Profile Banner */}
      <AnimatePresence>
        {activeProfile ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={tweens.standard}
          >
            <GlassCard variant="default" className="aurora-social-panel mb-4 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <BellSlashIcon className="h-6 w-6 text-amber-400" />
                    <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--token-text-primary)]">
                      {activeProfile.emoji ? `${activeProfile.emoji} ` : ''}
                      {activeProfile.name} is active
                    </p>
                    <p className="text-xs text-[var(--token-text-muted)]">
                      Notifications are filtered
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    HapticFeedback.medium();
                    handleDeactivate();
                  }}
                  className="aurora-social-button rounded-lg px-4 py-1.5 text-sm font-bold"
                >
                  Disable
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Profile List */}
      <div className="space-y-3">
        {isLoading && profiles.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : profiles.length === 0 ? (
          <GlassCard variant="default" className="aurora-social-panel p-8 text-center">
            <BellSlashIcon className="mx-auto mb-3 h-12 w-12 text-[var(--token-text-muted)]" />
            <h3 className="mb-1 font-medium text-[var(--token-text-primary)]">
              No Notification Profiles
            </h3>
            <p className="mb-4 text-sm text-[var(--token-text-muted)]">
              Create a profile to set up named DND schedules with per-contact exceptions.
            </p>
          </GlassCard>
        ) : (
          profiles.map((profile) => (
            <GlassCard
              key={profile.id}
              variant="default"
              className="aurora-social-panel cursor-pointer p-4 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => handleProfileClick(profile)}
              onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, profile)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: `${profile.color}20`, color: profile.color }}
                  >
                    {profile.emoji || '🔕'}
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--token-text-primary)]">{profile.name}</h3>
                    <p className="text-xs text-[var(--token-text-muted)]">
                      {profile.schedule?.enabled
                        ? `${hhmmToDisplayString(profile.schedule.start_time)} - ${hhmmToDisplayString(profile.schedule.end_time)}`
                        : 'No schedule'}
                      {profile.allowed_members.length > 0
                        ? ` · ${profile.allowed_members.length} exception${profile.allowed_members.length !== 1 ? 's' : ''}`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${getScheduleStatusColor(profile, activeProfile?.id ?? null)}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full bg-white ${activeProfile?.id === profile.id ? 'animate-pulse' : ''}`}
                    />
                    {getScheduleStatusLabel(profile, activeProfile?.id ?? null)}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Create Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => {
            HapticFeedback.medium();
            navigate('/settings/notification-profiles/new');
          }}
          className="aurora-social-button flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-[var(--token-text-primary)]"
        >
          <PlusIcon className="h-5 w-5" />
          Create Profile
        </button>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {menuTarget ? (
          <NotificationProfilesMenu
            profile={menuTarget}
            position={menuPosition}
            isActive={activeProfile?.id === menuTarget.id}
            onQuickEnable={handleQuickEnable}
            onDeactivate={handleDeactivate}
            onDelete={() => handleDeleteProfile(menuTarget.id)}
            onClose={() => setMenuTarget(null)}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
