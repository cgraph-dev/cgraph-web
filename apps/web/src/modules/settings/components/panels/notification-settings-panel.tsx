/**
 * Notification preferences settings panel.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useSettingsStore } from '@/modules/settings/store';
import { Button, GlassCard, Skeleton, toast } from '@/shared/components/ui';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';
import { createLogger } from '@/lib/logger';
import {
  isPushSupported,
  getPushPermission,
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  type PushPermission,
} from '@/lib/push';

const logger = createLogger('NotificationSettingsPanel');

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

interface PushState {
  readonly supported: boolean;
  readonly permission: PushPermission;
  readonly registered: boolean;
}

async function readPushState(): Promise<PushState> {
  if (!isPushSupported()) {
    return { supported: false, permission: 'unsupported', registered: false };
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = registration ? await registration.pushManager.getSubscription() : null;

  return {
    supported: true,
    permission: getPushPermission(),
    registered: subscription !== null,
  };
}

/**
 * Notification Settings Panel component.
 */
export function NotificationSettingsPanel() {
  const navigate = useNavigate();
  const { settings, updateNotificationSettings, isSaving, fetchSettings } = useSettingsStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [pushState, setPushState] = useState<PushState>({
    supported: false,
    permission: 'default',
    registered: false,
  });

  useEffect(() => {
    fetchSettings().finally(() => setIsLoaded(true));
    readPushState().then(setPushState);
  }, [fetchSettings]);

  async function handleToggle(key: keyof typeof settings.notifications, value: boolean) {
    try {
      await updateNotificationSettings({ [key]: value });
      toast.success('Settings saved');
    } catch (error) {
      logger.error('Failed to save notification settings', error);
      toast.error('Failed to save settings');
    }
  }

  // Special handler for push notifications that also handles browser permission.
  // MUST be invoked from this user-gesture handler (button click) — calling
  // requestPushPermission outside a gesture triggers a Safari permanent denial.
  async function handlePushToggle() {
    if (!pushState.supported) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    const enabling = !settings.notifications.pushNotifications;

    if (enabling) {
      if (!VAPID_PUBLIC_KEY) {
        toast.error('Push notifications are not configured on this server');
        logger.warn('VITE_VAPID_PUBLIC_KEY is not set');
        return;
      }

      const permission = await requestPushPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission was not granted');
        setPushState((prev) => ({ ...prev, permission }));
        return;
      }

      const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);
      if (!subscription) {
        toast.error('Failed to subscribe to push notifications');
        return;
      }

      await updateNotificationSettings({ pushNotifications: true });
      setPushState({ supported: true, permission: 'granted', registered: true });
      toast.success('Push notifications enabled');
      return;
    }

    const ok = await unsubscribeFromPush();
    if (!ok) {
      toast.error('Failed to unsubscribe from push notifications');
      return;
    }
    await updateNotificationSettings({ pushNotifications: false });
    setPushState((prev) => ({ ...prev, registered: false }));
    toast.success('Push notifications disabled');
  }

  const Toggle = ({
    settingKey,
    value,
  }: {
    settingKey: keyof typeof settings.notifications;
    value: boolean;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => handleToggle(settingKey, !value)}
      disabled={isSaving}
      data-checked={value}
      className={`aurora-social-toggle relative h-6 w-11 rounded-full ${isSaving ? 'cursor-wait opacity-50' : ''}`}
    >
      <span className="aurora-social-toggle-thumb absolute left-1 top-1 h-4 w-4 rounded-full" />
    </button>
  );

  if (!isLoaded) {
    return (
      <div className="space-y-4" aria-label="Loading notification settings">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} transition={tweens.standard}>
      <div className="mb-6 flex items-start gap-3">
        <div className="aurora-page-icon p-3">
          <BellIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-primary-300/75 mb-1 text-[11px] font-black uppercase tracking-[0.24em]">
            Alerts & Delivery
          </p>
          <h1 className="text-2xl font-semibold text-[var(--token-text-primary)]">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
            Choose which message, mention, and browser alerts you receive.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Direct Messages</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Notify when you receive a message
              </p>
            </div>
            <Toggle settingKey="notifyMessages" value={settings.notifications.notifyMessages} />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Mentions</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Notify when someone mentions you
              </p>
            </div>
            <Toggle settingKey="notifyMentions" value={settings.notifications.notifyMentions} />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Forum Replies</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Notify when someone replies to your post
              </p>
            </div>
            <Toggle
              settingKey="notifyForumReplies"
              value={settings.notifications.notifyForumReplies}
            />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Friend Requests</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Notify when you receive a friend request
              </p>
            </div>
            <Toggle
              settingKey="notifyFriendRequests"
              value={settings.notifications.notifyFriendRequests}
            />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Group Invites</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Notify when you're invited to a group
              </p>
            </div>
            <Toggle
              settingKey="notifyGroupInvites"
              value={settings.notifications.notifyGroupInvites}
            />
          </div>
        </GlassCard>

        {/* Economy / Nodes */}
        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Economy & Nodes</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Tips, gifts, subscriptions, and commissions
              </p>
            </div>
            <Toggle settingKey="notifyEconomy" value={settings.notifications.notifyEconomy} />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">System Notifications</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Security alerts, account updates, and announcements
              </p>
            </div>
            <Toggle settingKey="notifySystem" value={settings.notifications.notifySystem} />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Email Notifications</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Receive notifications via email
              </p>
            </div>
            <Toggle
              settingKey="emailNotifications"
              value={settings.notifications.emailNotifications}
            />
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Push Notifications</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                {pushState.supported
                  ? pushState.permission === 'denied'
                    ? 'Blocked - enable in browser settings'
                    : 'Receive push notifications in this browser'
                  : 'Not supported in this browser'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.notifications.pushNotifications && pushState.registered}
              onClick={handlePushToggle}
              disabled={isSaving || !pushState.supported || pushState.permission === 'denied'}
              data-checked={settings.notifications.pushNotifications && pushState.registered}
              className={`aurora-social-toggle relative h-6 w-11 rounded-full ${isSaving || !pushState.supported || pushState.permission === 'denied' ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <span className="aurora-social-toggle-thumb absolute left-1 top-1 h-4 w-4 rounded-full" />
            </button>
          </div>
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">Notification Sound</h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Play a sound for notifications
              </p>
            </div>
            <Toggle
              settingKey="notificationSound"
              value={settings.notifications.notificationSound}
            />
          </div>
        </GlassCard>

        {/* Notification Profiles Link */}
        <GlassCard variant="default" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--token-text-primary)]">
                Notification Profiles
              </h3>
              <p className="text-sm text-[var(--token-text-secondary)]">
                Named DND schedules with per-contact exceptions
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              animated={false}
              onClick={() => {
                HapticFeedback.light();
                navigate('/me/settings/notification-profiles');
              }}
            >
              Configure
            </Button>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
