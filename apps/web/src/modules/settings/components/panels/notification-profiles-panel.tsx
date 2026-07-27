/**
 * Notification Profiles list panel.
 *
 * Lists all notification profiles with create/edit/delete, active profile
 * indicator, and manual enable/disable toggle with duration picker.
 * Replaces the old DndSchedulePanel placeholder.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeftIcon,
  PlusIcon,
  BellSlashIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';
import { useNotificationProfileStore } from '@/modules/settings/store/notification-profile-store';
import { NotificationProfilesMenu } from './notification-profiles-menu';
import type { NotificationProfile } from '@cgraph-dev/shared-types';
import { hhmmToDisplayString } from '@cgraph-dev/shared-types';

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

/**
 * Notification Profiles Panel component.
 */
export function NotificationProfilesPanel(): React.ReactNode {
  const navigate = useNavigate();
  const {
    profiles,
    activeProfile,
    isLoading,
    isMutating,
    error,
    fetchProfiles,
    deleteProfile,
    activateProfile,
    deactivateProfile,
  } = useNotificationProfileStore();

  const [menuTarget, setMenuTarget] = useState<NotificationProfile | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    void fetchProfiles();
  }, [fetchProfiles]);

  function handleProfileClick(profile: NotificationProfile): void {
    HapticFeedback.light();
    navigate(`/me/settings/notification-profiles/${profile.id}`);
  }

  function handleContextMenu(e: React.MouseEvent, profile: NotificationProfile): void {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setMenuTarget(profile);
  }

  async function handleQuickEnable(durationMinutes: number | null): Promise<void> {
    if (menuTarget) {
      const activated = await activateProfile(menuTarget.id, durationMinutes);
      if (activated) {
        setMenuTarget(null);
      }
    }
  }

  async function handleDeactivate(): Promise<void> {
    const deactivated = await deactivateProfile();
    if (deactivated) {
      setMenuTarget(null);
    }
  }

  function handleDeleteProfile(profileId: string): void {
    deleteProfile(profileId);
    setMenuTarget(null);
  }

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} transition={tweens.standard}>
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          aria-label="Back to notification settings"
          onClick={() => {
            HapticFeedback.light();
            navigate('/me/settings/notifications');
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
                  type="button"
                  disabled={isMutating}
                  onClick={() => {
                    HapticFeedback.medium();
                    void handleDeactivate();
                  }}
                  className="aurora-social-button rounded-lg px-4 py-1.5 text-sm font-bold disabled:cursor-wait disabled:opacity-50"
                >
                  Disable
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {error ? (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            className="shrink-0 font-semibold text-red-100 underline underline-offset-2 disabled:cursor-wait disabled:opacity-50"
            disabled={isLoading || isMutating}
            onClick={() => void fetchProfiles()}
          >
            Retry
          </button>
        </div>
      ) : null}

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
              className="aurora-social-panel p-4"
              onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, profile)}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--token-focus-ring)]"
                  onClick={() => handleProfileClick(profile)}
                  aria-label={`Edit ${profile.name}`}
                >
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
                </button>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${getScheduleStatusColor(profile, activeProfile?.id ?? null)}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full bg-white ${activeProfile?.id === profile.id ? 'animate-pulse' : ''}`}
                    />
                    {getScheduleStatusLabel(profile, activeProfile?.id ?? null)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Actions for ${profile.name}`}
                    aria-haspopup="menu"
                    aria-expanded={menuTarget?.id === profile.id}
                    disabled={isMutating}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[var(--token-text-muted)] hover:bg-[var(--token-surface-hover)] hover:text-[var(--token-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--token-focus-ring)] disabled:cursor-wait disabled:opacity-50"
                    onClick={(event) => {
                      event.stopPropagation();
                      const bounds = event.currentTarget.getBoundingClientRect();
                      setMenuPosition({ x: bounds.right, y: bounds.bottom });
                      setMenuTarget(profile);
                    }}
                  >
                    <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Create Button */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => {
            HapticFeedback.medium();
            navigate('/me/settings/notification-profiles/new');
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
            disabled={isMutating}
            onQuickEnable={(durationMinutes) => void handleQuickEnable(durationMinutes)}
            onDeactivate={() => void handleDeactivate()}
            onDelete={() => handleDeleteProfile(menuTarget.id)}
            onClose={() => setMenuTarget(null)}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
