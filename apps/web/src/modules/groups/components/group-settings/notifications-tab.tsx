import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BellSlashIcon, ChatBubbleLeftIcon, AtSymbolIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Card, { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useGroupStore } from '@/modules/groups/store';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { FADE_UP } from '@/lib/animations/transitions';

const logger = createLogger('NotificationsTab');

type NotificationLevel = 'all' | 'mentions' | 'none';

interface NotificationsTabProps {
  groupId: string;
}

/**
 * Notifications Tab component.
 */
export function NotificationsTab({ groupId }: NotificationsTabProps) {
  const { groups } = useGroupStore();
  const activeGroup = groups.find((g) => g.id === groupId);
  const myMember = activeGroup?.myMember;

  const [suppressEveryone, setSuppressEveryone] = useState(myMember?.suppressEveryone ?? false);
  const [notifLevel, setNotifLevel] = useState<NotificationLevel>(
    myMember?.notifications ?? 'mentions'
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state when member data loads
  useEffect(() => {
    if (myMember) {
      setNotifLevel(myMember.notifications ?? 'mentions');
      setSuppressEveryone(myMember.suppressEveryone ?? false);
    }
  }, [myMember]);

  const notifOptions: Array<{
    level: NotificationLevel;
    label: string;
    desc: string;
    icon: typeof ChatBubbleLeftIcon;
  }> = [
    {
      level: 'all',
      label: 'All Messages',
      desc: 'Receive notifications for every message',
      icon: ChatBubbleLeftIcon,
    },
    {
      level: 'mentions',
      label: 'Only @Mentions',
      desc: 'Only receive notifications when mentioned',
      icon: AtSymbolIcon,
    },
    {
      level: 'none',
      label: 'Nothing',
      desc: 'Suppress all notifications from this group',
      icon: BellSlashIcon,
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await http.patch(`/api/v1/groups/${groupId}/members/me/notifications`, {
        notifications: notifLevel,
        suppress_everyone: suppressEveryone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      logger.error('Failed to save notification preferences', error);
      setError('Failed to save notification preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} className="max-w-2xl space-y-6">
      <div className="cgraph-page-header">
        <div>
          <p className="cgraph-eyebrow">Group settings</p>
          <h2 className="text-2xl font-bold text-[var(--token-text-primary)]">Notifications</h2>
          <p className="mt-1 text-sm text-[var(--token-text-muted)]">
            Configure notification preferences for this group.
          </p>
        </div>
      </div>

      {/* Notification Level */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Notification level</CardTitle>
          <CardDescription>Choose which group activity should notify you.</CardDescription>
        </CardHeader>
        <fieldset className="space-y-2">
          <legend className="sr-only">Notification level</legend>
          {notifOptions.map((opt) => {
            const Icon = opt.icon;
            const selected = notifLevel === opt.level;
            return (
              <label
                key={opt.level}
                className="cgraph-list-row flex min-h-16 cursor-pointer items-center gap-3 px-3 py-2.5"
                data-selected={selected || undefined}
              >
                <input
                  type="radio"
                  name="group-notification-level"
                  value={opt.level}
                  checked={selected}
                  onChange={() => setNotifLevel(opt.level)}
                  className="sr-only"
                />
                <span className="cgraph-empty-icon mb-0 h-10 w-10 shrink-0">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[var(--token-text-primary)]">
                    {opt.label}
                  </span>
                  <span className="block text-sm text-[var(--token-text-muted)]">{opt.desc}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected
                      ? 'border-[var(--token-interactive-primary)]'
                      : 'border-[var(--product-line-strong)]'
                  }`}
                >
                  {selected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--token-interactive-primary)]" />
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
      </Card>

      {/* Suppression Settings */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Suppression</CardTitle>
          <CardDescription>
            Reduce broad group mentions without muting direct mentions.
          </CardDescription>
        </CardHeader>
        <div className="flex min-h-14 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <AtSymbolIcon className="h-5 w-5 shrink-0 text-[var(--token-text-muted)]" />
            <div>
              <label
                htmlFor="group-suppress-everyone"
                className="text-sm font-medium text-[var(--token-text-primary)]"
              >
                Suppress @everyone
              </label>
              <p className="text-xs text-[var(--token-text-muted)]">Ignore mass mentions</p>
            </div>
          </div>
          <Switch
            id="group-suppress-everyone"
            checked={suppressEveryone}
            onCheckedChange={setSuppressEveryone}
            disabled={saving}
          />
        </div>
      </Card>

      {error && (
        <div
          role="alert"
          className="rounded-[var(--product-radius-md)] border border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] px-3 py-2 text-sm text-[var(--token-feedback-error)]"
        >
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <span
          className="text-sm text-[var(--token-feedback-success)]"
          role="status"
          aria-live="polite"
        >
          {saved ? 'Preferences saved.' : ''}
        </span>
        <Button onClick={handleSave} disabled={saving} isLoading={saving}>
          Save preferences
        </Button>
      </div>
    </motion.div>
  );
}
