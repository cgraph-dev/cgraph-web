/**
 * Hook encapsulating fetch/save logic for email notification preferences.
 */

import { useCallback, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/modules/auth/store';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import {
  DEFAULT_EMAIL_PREFERENCES,
  type EmailPreferences,
} from '@/pages/settings/emailNotificationSettings.constants';

const logger = createLogger('EmailNotificationSettings');

/**
 * Hook for managing email notification preferences.
 */
export function useEmailNotificationPreferences() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>(DEFAULT_EMAIL_PREFERENCES);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await http.get('/api/v1/me');
      const d = response.data?.data ?? response.data;

      setPreferences({
        emailNotificationsEnabled: d.email_notifications_enabled ?? d.email_notifications ?? true,
        emailDigestEnabled: d.email_digest_enabled ?? true,
        emailDigestFrequency: d.email_digest_frequency ?? 'weekly',
        emailOnNewMessage: d.email_on_new_message ?? d.notify_messages ?? true,
        emailOnFriendRequest: d.email_on_friend_request ?? d.notify_friend_requests ?? true,
        emailOnMention: d.email_on_mention ?? d.notify_mentions ?? true,
        emailOnReply: d.email_on_reply ?? d.notify_forum_replies ?? true,
        emailOnAchievement: d.email_on_achievement ?? false,
      });
    } catch (error) {
      logger.error('Failed to fetch email preferences:', error);
      toast.error('Failed to load email preferences');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const savePreferences = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);

      await http.put('/api/v1/settings/notifications', {
        email_notifications: preferences.emailNotificationsEnabled,
        notify_messages: preferences.emailOnNewMessage,
        notify_friend_requests: preferences.emailOnFriendRequest,
        notify_mentions: preferences.emailOnMention,
        notify_forum_replies: preferences.emailOnReply,
      });
      await http.put('/api/v1/me', {
        user: {
          email_notifications_enabled: preferences.emailNotificationsEnabled,
          email_digest_enabled: preferences.emailDigestEnabled,
          email_digest_frequency: preferences.emailDigestFrequency,
          email_on_new_message: preferences.emailOnNewMessage,
          email_on_friend_request: preferences.emailOnFriendRequest,
          email_on_mention: preferences.emailOnMention,
          email_on_reply: preferences.emailOnReply,
          email_on_achievement: preferences.emailOnAchievement,
        },
      });

      toast.success('Email preferences saved successfully!');
    } catch (error) {
      logger.error('Failed to save email preferences:', error);
      toast.error('Failed to save email preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof EmailPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setDigestFrequency = (frequency: EmailPreferences['emailDigestFrequency']) => {
    setPreferences((prev) => ({ ...prev, emailDigestFrequency: frequency }));
  };

  return { loading, saving, preferences, savePreferences, togglePreference, setDigestFrequency };
}
