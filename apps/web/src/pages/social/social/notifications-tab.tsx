import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  CalendarDays,
  Flame,
  Gift,
  Megaphone,
  MessageCircle,
  Newspaper,
  Trophy,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { formatTimeAgo } from './utils';
import type { NotificationsTabProps } from './types';

type NotificationRow = NotificationsTabProps['notifications'][number];

function getNotificationIcon(type: NotificationRow['type']): LucideIcon {
  switch (type) {
    case 'friend_request':
    case 'friend_accepted':
      return UserPlus;
    case 'message':
    case 'message_request':
      return MessageCircle;
    case 'group_invite':
    case 'group_mention':
    case 'channel_mention':
      return UsersRound;
    case 'forum_reply':
    case 'forum_mention':
    case 'post_reply':
      return Newspaper;
    case 'achievement':
    case 'level_up':
    case 'quest_completed':
      return Trophy;
    case 'streak_reminder':
      return Flame;
    case 'gift_received':
      return Gift;
    case 'event_reminder':
    case 'event_invite':
      return CalendarDays;
    case 'mention':
      return Megaphone;
    default:
      return Bell;
  }
}

function rowActionLabel(notification: NotificationRow): string {
  if (notification.actionUrl) {
    return `${notification.read ? 'Open' : 'Open unread'} notification: ${notification.title}`;
  }

  return `${notification.read ? 'Notification' : 'Mark notification as read'}: ${notification.title}`;
}

export function NotificationsTab({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsTabProps) {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="h-7 w-7" />}
        title="All clear"
        message="New messages, mentions, and activity will appear here."
      />
    );
  }

  return (
    <section className="space-y-4" aria-label="Notifications">
      <div className="flex min-h-10 items-center justify-between gap-3">
        <p className="text-sm text-[var(--token-text-muted)]" aria-live="polite">
          {unreadCount > 0
            ? `${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}`
            : 'All caught up'}
        </p>
        {unreadCount > 0 ? (
          <Button variant="outline" size="sm" animated={false} onClick={onMarkAllAsRead}>
            Mark all as read
          </Button>
        ) : null}
      </div>

      <ul className="space-y-2" aria-label="Notifications list">
        {notifications.map((notification) => (
          <li key={notification.id} className="list-none">
            <button
              type="button"
              className="cgraph-list-row relative flex w-full items-start gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--token-focus-ring)]"
              data-read={notification.read}
              aria-label={rowActionLabel(notification)}
              onClick={() => {
                if (!notification.read) onMarkAsRead(notification.id);
                if (notification.actionUrl) navigate(notification.actionUrl);
              }}
            >
              <NotificationAvatar notification={notification} />

              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-semibold text-[var(--token-text-primary)]">
                    {notification.title}
                  </span>
                  <time
                    dateTime={notification.timestamp.toISOString()}
                    className="shrink-0 text-xs text-[var(--token-text-muted)]"
                  >
                    {formatTimeAgo(notification.timestamp)}
                  </time>
                </span>
                <span className="mt-1 line-clamp-2 block text-sm leading-5 text-[var(--token-text-secondary)]">
                  {notification.message}
                </span>
              </span>

              {!notification.read ? (
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--token-interactive-primary)]"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NotificationAvatar({ notification }: { readonly notification: NotificationRow }) {
  if (notification.avatarUrl) {
    return (
      <img
        src={notification.avatarUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-md border border-[var(--token-card-border)] object-cover"
        loading="lazy"
      />
    );
  }

  const Icon = getNotificationIcon(notification.type);

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--token-card-border)] bg-[var(--product-surface-selected)] text-[var(--token-interactive-primary)]"
      aria-hidden="true"
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}
