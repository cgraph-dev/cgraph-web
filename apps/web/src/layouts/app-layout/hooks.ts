import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { useChatStore } from '@/modules/chat/store/chatStore.impl';
import { useGroupStore } from '@/modules/groups/store';
import { useNotificationStore } from '@/modules/social/store';
import { useThemeEnhanced } from '@/providers/theme-context-enhanced';
import { socketManager } from '@/lib/socket';
import { captureError } from '@/lib/error-tracking';

/** Use App Layout. */
export function useAppLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const { fetchConversations, conversations } = useChatStore();
  const { fetchGroups } = useGroupStore();
  const { fetchNotifications, unreadCount } = useNotificationStore();
  const { theme, preferences } = useThemeEnhanced();

  const backgroundSettings = {
    effect: preferences.settings.backgroundEffect || 'none',
    variant: preferences.settings.shaderVariant || 'matrix',
    intensity: preferences.settings.backgroundIntensity || 0.6,
  };

  useEffect(() => {
    if (!user?.id) return;

    const initializeApp = async () => {
      try {
        await Promise.allSettled([fetchConversations(), fetchGroups(), fetchNotifications()]);
      } catch (err) {
        captureError(err instanceof Error ? err : new Error('initializeApp error'), {
          component: 'AppLayout',
        });
      }
    };

    initializeApp();
  }, [fetchConversations, fetchGroups, fetchNotifications, user?.id]);

  const handleLogout = async () => {
    socketManager.disconnect();
    await logout();
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return {
    location,
    user,
    theme,
    backgroundSettings,
    handleLogout,
    totalUnread,
    unreadCount,
  };
}
