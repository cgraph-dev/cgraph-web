/**
 * Do Not Disturb Schedule settings panel.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeftIcon, ClockIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { GlassCard, toast } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';
import { useSettingsStore } from '@/modules/settings/store';

const DEFAULT_QUIET_HOURS_START = '22:00';
const DEFAULT_QUIET_HOURS_END = '08:00';

const BASE_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Bucharest',
  'Europe/Berlin',
  'Asia/Kolkata',
];

/**
 * DND Schedule Panel component.
 */
export function DndSchedulePanel() {
  const navigate = useNavigate();
  const { settings, updateNotificationSettings, updateLocaleSettings, isSaving } =
    useSettingsStore();
  const [enabled, setEnabled] = useState(settings.notifications.quietHoursEnabled);
  const [startTime, setStartTime] = useState(
    settings.notifications.quietHoursStart ?? DEFAULT_QUIET_HOURS_START
  );
  const [endTime, setEndTime] = useState(
    settings.notifications.quietHoursEnd ?? DEFAULT_QUIET_HOURS_END
  );
  const [timezone, setTimezone] = useState(settings.locale.timezone);

  const timezoneOptions = useMemo(
    () => Array.from(new Set([settings.locale.timezone, ...BASE_TIMEZONES])).filter(Boolean),
    [settings.locale.timezone]
  );

  useEffect(() => {
    setEnabled(settings.notifications.quietHoursEnabled);
    setStartTime(settings.notifications.quietHoursStart ?? DEFAULT_QUIET_HOURS_START);
    setEndTime(settings.notifications.quietHoursEnd ?? DEFAULT_QUIET_HOURS_END);
    setTimezone(settings.locale.timezone);
  }, [
    settings.locale.timezone,
    settings.notifications.quietHoursEnabled,
    settings.notifications.quietHoursEnd,
    settings.notifications.quietHoursStart,
  ]);

  async function handleSave() {
    HapticFeedback.medium();

    try {
      await updateNotificationSettings({
        quietHoursEnabled: enabled,
        quietHoursStart: enabled ? startTime : null,
        quietHoursEnd: enabled ? endTime : null,
      });

      if (timezone !== settings.locale.timezone) {
        await updateLocaleSettings({ timezone });
      }

      toast.success('Schedule saved');
      navigate('/me/settings/notifications');
    } catch {
      toast.error('Failed to save schedule');
    }
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
        <h1 className="bg-gradient-to-r from-[var(--token-text-primary)] via-primary-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
          Do Not Disturb Schedule
        </h1>
      </div>

      <div className="space-y-6">
        {/* Schedule Controls */}
        <GlassCard variant="default" className="aurora-social-panel p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="border-primary-500/20 bg-primary-500/10 flex h-10 w-10 items-center justify-center rounded-xl border text-primary-400">
              <ClockIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-[var(--token-text-primary)]">Quiet Hours</h3>
              <p className="text-sm text-[var(--token-text-muted)]">
                Set the timeframe for automatic DND
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Enable quiet hours"
              onClick={() => setEnabled((current) => !current)}
              disabled={isSaving}
              data-checked={enabled}
              className={`aurora-social-toggle relative h-6 w-11 rounded-full ${isSaving ? 'cursor-wait opacity-50' : ''}`}
            >
              <span className="aurora-social-toggle-thumb absolute left-1 top-1 h-4 w-4 rounded-full" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="dnd-start-time"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--token-text-muted)]"
              >
                Start Time
              </label>
              <input
                id="dnd-start-time"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                disabled={!enabled || isSaving}
                className="aurora-social-select w-full rounded-xl p-3 text-[var(--token-text-primary)]"
              />
            </div>
            <div>
              <label
                htmlFor="dnd-end-time"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--token-text-muted)]"
              >
                End Time
              </label>
              <input
                id="dnd-end-time"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                disabled={!enabled || isSaving}
                className="aurora-social-select w-full rounded-xl p-3 text-[var(--token-text-primary)]"
              />
            </div>
          </div>
        </GlassCard>

        {/* Timezone */}
        <GlassCard variant="default" className="aurora-social-panel p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="border-primary-500/20 bg-primary-500/10 flex h-10 w-10 items-center justify-center rounded-xl border text-primary-400">
              <GlobeAltIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Timezone</h3>
              <p className="text-sm text-[var(--token-text-muted)]">
                Schedule will follow this timezone
              </p>
            </div>
          </div>

          <select
            id="dnd-timezone"
            aria-label="Quiet hours timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            disabled={isSaving}
            className="aurora-social-select w-full rounded-xl p-3 text-[var(--token-text-primary)]"
          >
            {timezoneOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </GlassCard>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="aurora-social-button rounded-xl px-8 py-3 font-bold text-[var(--token-text-primary)]"
          >
            {isSaving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
