/**
 * Notification Profile Editor panel.
 *
 * Create or edit a notification profile: name, emoji, color, allow_all toggles,
 * schedule (time pickers + day-of-week), and allowed contacts management.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeftIcon,
  TrashIcon,
  PhoneIcon,
  AtSymbolIcon,
  CalendarDaysIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  GlassCard,
} from '@/shared/components/ui';
import { toast } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';
import { createLogger } from '@/lib/logger';
import { useNotificationProfileStore } from '@/modules/settings/store/notification-profile-store';
import { useFriendStore } from '@/modules/social/store/friendStore';
import { NotificationProfileDeleteDialog } from './notification-profile-delete-dialog';
import type { DayOfWeek } from '@cgraph-dev/shared-types';
import {
  ALL_DAYS,
  DAY_LETTERS,
  WEEKDAYS,
  hhmmToTimeInput,
  timeInputToHhmm,
} from '@cgraph-dev/shared-types';

const logger = createLogger('NotificationProfileEditor');

const PRESET_COLORS = [
  '#7c3aed',
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
] as const;

/**
 * Profile Editor component.
 */
export function NotificationProfileEditor(): React.ReactNode {
  const navigate = useNavigate();
  const { id, detail } = useParams<{ id?: string; detail?: string }>();
  const profileId = id ?? detail;
  const isNew = profileId === 'new';

  const {
    profiles,
    isMutating,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    setAllowedMembers,
  } = useNotificationProfileStore();
  const { friends, fetchFriends, error: friendError } = useFriendStore();

  // Form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState('#7c3aed');
  const [allowAllCalls, setAllowAllCalls] = useState(true);
  const [allowAllMentions, setAllowAllMentions] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [daysEnabled, setDaysEnabled] = useState<readonly DayOfWeek[]>([...WEEKDAYS]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAllowedContactsOpen, setIsAllowedContactsOpen] = useState(false);
  const [selectedAllowedContactIds, setSelectedAllowedContactIds] = useState<readonly string[]>([]);
  const [isLoadingAllowedContacts, setIsLoadingAllowedContacts] = useState(false);
  const [isSavingAllowedContacts, setIsSavingAllowedContacts] = useState(false);

  // Load existing profile data
  useEffect(() => {
    if (!isNew && profileId) {
      fetchProfiles();
    }
  }, [isNew, profileId, fetchProfiles]);

  const existingProfile = isNew ? null : profiles.find((p) => p.id === profileId);

  useEffect(() => {
    if (existingProfile) {
      setName(existingProfile.name);
      setEmoji(existingProfile.emoji);
      setColor(existingProfile.color);
      setAllowAllCalls(existingProfile.allow_all_calls);
      setAllowAllMentions(existingProfile.allow_all_mentions);
      setSelectedAllowedContactIds(existingProfile.allowed_members.map((member) => member.id));
      if (existingProfile.schedule) {
        setScheduleEnabled(existingProfile.schedule.enabled);
        setStartTime(hhmmToTimeInput(existingProfile.schedule.start_time));
        setEndTime(hhmmToTimeInput(existingProfile.schedule.end_time));
        const days: readonly DayOfWeek[] = existingProfile.schedule.days_enabled;
        setDaysEnabled(days);
      }
    }
  }, [existingProfile]);

  function toggleDay(day: DayOfWeek): void {
    setDaysEnabled((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function displayFriendName(friend: (typeof friends)[number]): string {
    return friend.displayName || friend.username || 'Contact';
  }

  function toggleAllowedContact(userId: string): void {
    setSelectedAllowedContactIds((current) =>
      current.includes(userId)
        ? current.filter((selectedId) => selectedId !== userId)
        : [...current, userId]
    );
  }

  function openAllowedContacts(): void {
    if (!existingProfile) return;

    setSelectedAllowedContactIds(existingProfile.allowed_members.map((member) => member.id));
    setIsAllowedContactsOpen(true);
    setIsLoadingAllowedContacts(true);
    void fetchFriends().finally(() => setIsLoadingAllowedContacts(false));
  }

  async function saveAllowedContacts(): Promise<void> {
    if (!existingProfile) return;

    const acceptedContactIds = new Set(friends.map((friend) => friend.id));
    const userIds = selectedAllowedContactIds.filter((userId) => acceptedContactIds.has(userId));

    setIsSavingAllowedContacts(true);

    try {
      const updated = await setAllowedMembers(existingProfile.id, userIds);
      if (updated) {
        setIsAllowedContactsOpen(false);
      }
    } finally {
      setIsSavingAllowedContacts(false);
    }
  }

  async function handleSave(): Promise<void> {
    if (!name.trim()) {
      toast.error('Profile name is required');
      return;
    }

    setIsSaving(true);
    HapticFeedback.medium();

    try {
      const params = {
        name: name.trim(),
        emoji,
        color,
        allow_all_calls: allowAllCalls,
        allow_all_mentions: allowAllMentions,
        schedule: {
          enabled: scheduleEnabled,
          start_time: timeInputToHhmm(startTime),
          end_time: timeInputToHhmm(endTime),
          days_enabled: [...daysEnabled],
        },
      };

      if (isNew) {
        const created = await createProfile(params);
        if (created) {
          navigate('/me/settings/notification-profiles');
        }
      } else if (existingProfile) {
        const updated = await updateProfile(existingProfile.id, params);
        if (updated) {
          navigate('/me/settings/notification-profiles');
        }
      }
    } catch (err) {
      logger.error('Failed to save profile', err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (existingProfile) {
      HapticFeedback.heavy();
      const deleted = await deleteProfile(existingProfile.id);
      if (deleted) {
        setShowDeleteConfirm(false);
        navigate('/me/settings/notification-profiles');
      }
    }
  }

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} transition={tweens.standard}>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => {
            HapticFeedback.light();
            navigate('/me/settings/notification-profiles');
          }}
          className="aurora-social-button-muted flex h-10 w-10 items-center justify-center rounded-xl text-[var(--token-text-secondary)]"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="bg-gradient-to-r from-[var(--token-text-primary)] via-primary-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
          {isNew ? 'Create Profile' : 'Edit Profile'}
        </h1>
      </div>

      <div className="space-y-4">
        {/* Name + Emoji */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--token-text-muted)]">
            Profile Name
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 8))}
              placeholder="emoji"
              maxLength={8}
              className="aurora-social-select w-16 rounded-xl p-3 text-center text-lg text-[var(--token-text-primary)]"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 64))}
              placeholder="e.g. Work, Sleep, Focus"
              maxLength={64}
              className="aurora-social-select flex-1 rounded-xl p-3 text-[var(--token-text-primary)]"
            />
          </div>
        </GlassCard>

        {/* Color */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-[var(--token-text-muted)]">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[var(--token-surface)]' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-full border-0 p-0"
            />
          </div>
        </GlassCard>

        {/* Allow All Calls */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PhoneIcon className="h-5 w-5 text-primary-400" />
              <div>
                <h3 className="font-medium text-[var(--token-text-primary)]">Allow all calls</h3>
                <p className="text-sm text-[var(--token-text-muted)]">
                  Calls always ring even when profile is active
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={allowAllCalls}
              onClick={() => setAllowAllCalls((v) => !v)}
              data-checked={allowAllCalls}
              className="aurora-social-toggle relative h-6 w-11 rounded-full"
            >
              <span className="aurora-social-toggle-thumb absolute left-1 top-1 h-4 w-4 rounded-full" />
            </button>
          </div>
        </GlassCard>

        {/* Allow All Mentions */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AtSymbolIcon className="h-5 w-5 text-primary-400" />
              <div>
                <h3 className="font-medium text-[var(--token-text-primary)]">Allow all mentions</h3>
                <p className="text-sm text-[var(--token-text-muted)]">
                  @mentions and replies still notify you
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={allowAllMentions}
              onClick={() => setAllowAllMentions((v) => !v)}
              data-checked={allowAllMentions}
              className="aurora-social-toggle relative h-6 w-11 rounded-full"
            >
              <span className="aurora-social-toggle-thumb absolute left-1 top-1 h-4 w-4 rounded-full" />
            </button>
          </div>
        </GlassCard>

        {/* Schedule */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDaysIcon className="h-5 w-5 text-primary-400" />
              <div>
                <h3 className="font-medium text-[var(--token-text-primary)]">Schedule</h3>
                <p className="text-sm text-[var(--token-text-muted)]">
                  Automatically activate on schedule
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={scheduleEnabled}
              onClick={() => setScheduleEnabled((v) => !v)}
              data-checked={scheduleEnabled}
              className="aurora-social-toggle relative h-6 w-11 rounded-full"
            >
              <span className="aurora-social-toggle-thumb absolute left-1 top-1 h-4 w-4 rounded-full" />
            </button>
          </div>

          {scheduleEnabled ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--token-text-muted)]">
                    Start
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="aurora-social-select w-full rounded-xl p-3 text-[var(--token-text-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--token-text-muted)]">
                    End
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="aurora-social-select w-full rounded-xl p-3 text-[var(--token-text-primary)]"
                  />
                </div>
              </div>

              {/* Day of week selector */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--token-text-muted)]">
                  Days
                </label>
                <div className="flex gap-2">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                        daysEnabled.includes(day)
                          ? 'bg-primary-500 text-white'
                          : 'bg-[var(--token-surface-hover)] text-[var(--token-text-muted)]'
                      }`}
                    >
                      {DAY_LETTERS[day]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </GlassCard>

        {/* Allowed contacts */}
        {!isNew && existingProfile ? (
          <GlassCard variant="default" className="aurora-social-panel p-4">
            <div className="flex items-center gap-3">
              <UserPlusIcon className="h-5 w-5 text-primary-400" />
              <div className="flex-1">
                <h3 className="font-medium text-[var(--token-text-primary)]">Allowed Contacts</h3>
                <p className="text-sm text-[var(--token-text-muted)]">
                  {existingProfile.allowed_members.length > 0
                    ? `${existingProfile.allowed_members.length} contact${existingProfile.allowed_members.length !== 1 ? 's' : ''} can bypass this profile`
                  : 'No exceptions — all notifications filtered'}
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={openAllowedContacts} animated={false}>
                Manage
              </Button>
            </div>
            {existingProfile.allowed_members.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {existingProfile.allowed_members.map((member) => (
                  <span
                    key={member.id}
                    className="inline-flex items-center rounded-full bg-[var(--token-surface-hover)] px-3 py-1 text-xs text-[var(--token-text-secondary)]"
                  >
                    {member.username ?? 'Unknown'}
                  </span>
                ))}
              </div>
            ) : null}
          </GlassCard>
        ) : null}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          {!isNew && existingProfile ? (
            <Button
              type="button"
              variant="ghost"
              leftIcon={<TrashIcon aria-hidden="true" />}
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-400"
              animated={false}
            >
              Delete
            </Button>
          ) : (
            <div />
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="aurora-social-button rounded-xl px-8 py-3 font-bold text-[var(--token-text-primary)] disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : isNew ? 'Create Profile' : 'Save Changes'}
          </button>
        </div>
      </div>

      <Dialog open={isAllowedContactsOpen} onOpenChange={(open) => !open && setIsAllowedContactsOpen(false)}>
        <DialogContent
          ariaLabel="Allowed contacts"
          className="max-h-[calc(100vh-2rem)] max-w-lg overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Allowed contacts</DialogTitle>
            <DialogDescription>
              Selected accepted contacts can notify you while this profile is active.
            </DialogDescription>
          </DialogHeader>

          {friendError ? (
            <p className="text-sm text-red-300" role="alert">
              {friendError}
            </p>
          ) : null}

          {isLoadingAllowedContacts ? (
            <div className="flex justify-center py-8" aria-label="Loading contacts">
              <div className="size-7 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
            </div>
          ) : friends.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--token-text-muted)]">
              You do not have any accepted contacts yet.
            </p>
          ) : (
            <fieldset className="divide-y divide-[var(--token-border-muted)]">
              <legend className="sr-only">Allowed contacts</legend>
              {friends.map((friend) => {
                const checked = selectedAllowedContactIds.includes(friend.id);
                const label = displayFriendName(friend);

                return (
                  <label key={friend.id} className="flex cursor-pointer items-center gap-3 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAllowedContact(friend.id)}
                      aria-label={`Allow ${label}`}
                      className="size-4 accent-primary-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--token-text-primary)]">
                        {label}
                      </span>
                      <span className="block truncate text-sm text-[var(--token-text-muted)]">
                        @{friend.username}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAllowedContactsOpen(false)}
              disabled={isSavingAllowedContacts}
              animated={false}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void saveAllowedContacts()}
              isLoading={isSavingAllowedContacts}
              disabled={isLoadingAllowedContacts || Boolean(friendError)}
              animated={false}
            >
              Save allowed contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotificationProfileDeleteDialog
        profileName={existingProfile?.name ?? ''}
        open={showDeleteConfirm && existingProfile !== null}
        isDeleting={isMutating}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => void handleDelete()}
      />
    </motion.div>
  );
}
