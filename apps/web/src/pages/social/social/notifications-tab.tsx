import { useNavigate } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';
import { motion } from 'motion/react';
import {
  BellIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  FireIcon,
  GiftIcon,
  MegaphoneIcon,
  TrophyIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { formatTimeAgo } from './utils';
import type { NotificationsTabProps } from './types';

type NotificationIcon = ComponentType<SVGProps<SVGSVGElement>>;
type NotificationRow = NotificationsTabProps['notifications'][number];

function getNotificationIcon(type: NotificationRow['type']): NotificationIcon {
  switch (type) {
    case 'friend_request':
    case 'friend_accepted':
      return UserPlusIcon;
    case 'message':
      return ChatBubbleLeftRightIcon;
    case 'group_invite':
    case 'group_mention':
    case 'channel_mention':
      return UserGroupIcon;
    case 'forum_reply':
    case 'forum_mention':
    case 'post_reply':
      return DocumentTextIcon;
    case 'achievement':
    case 'level_up':
    case 'quest_completed':
      return TrophyIcon;
    case 'streak_reminder':
      return FireIcon;
    case 'gift_received':
      return GiftIcon;
    case 'event_reminder':
    case 'event_invite':
      return CalendarDaysIcon;
    case 'mention':
      return MegaphoneIcon;
    default:
      return BellIcon;
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
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <section className="space-y-5" aria-label="Notifications">
      <div className="flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          {unreadCount > 0 ? `${unreadCount} Unread` : 'All Caught Up'}
          <span className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
        </h3>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="w-full rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-bg-primary)] py-2.5 text-xs font-black uppercase tracking-widest text-white/50 transition-all hover:bg-[var(--token-bg-secondary)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 active:scale-[0.98]"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-bg-primary)] px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--token-bg-secondary)] ring-1 ring-white/[0.06]">
            <BellIconSolid className="h-7 w-7 text-primary-400/40" />
          </div>
          <h4 className="mb-1 text-sm font-bold text-white/80">All clear</h4>
          <p className="text-xs text-white/30">No new notifications at this time.</p>
        </div>
      ) : (
        <ul className="space-y-1.5" aria-label="Notifications list">
          {notifications.map((notification, index) => (
            <motion.li
              key={notification.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group list-none"
            >
              <button
                type="button"
                className={`relative flex min-h-16 w-full items-start gap-3 rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-bg-primary)] p-3 text-left transition-all duration-200 hover:border-[var(--token-card-border)] hover:bg-[var(--token-bg-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${
                  notification.read ? 'opacity-65' : 'opacity-100'
                }`}
                aria-label={rowActionLabel(notification)}
                onClick={() => {
                  if (!notification.read) {
                    onMarkAsRead(notification.id);
                  }
                  if (notification.actionUrl) {
                    navigate(notification.actionUrl);
                  }
                }}
              >
                <NotificationAvatar notification={notification} />

                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-start justify-between gap-2">
                    <h4
                      className={`min-w-0 truncate text-sm font-bold transition-colors ${notification.read ? 'text-white/55' : 'text-white'}`}
                    >
                      {notification.title}
                    </h4>
                    <time
                      dateTime={notification.timestamp.toISOString()}
                      className="shrink-0 text-[10px] font-medium text-white/30"
                    >
                      {formatTimeAgo(notification.timestamp)}
                    </time>
                  </div>
                  <p
                    className={`line-clamp-2 text-xs leading-relaxed transition-colors ${notification.read ? 'text-white/35' : 'text-white/65'}`}
                  >
                    {notification.message}
                  </p>
                </div>

                {!notification.read ? (
                  <span
                    className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-400"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NotificationAvatar({ notification }: { notification: NotificationRow }) {
  if (notification.avatarUrl) {
    return (
      <img
        src={notification.avatarUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-white/[0.08]"
      />
    );
  }

  const Icon = getNotificationIcon(notification.type);

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${
        notification.read
          ? 'border-transparent bg-[var(--token-bg-secondary)] text-white/30'
          : 'border-primary-500/20 bg-primary-500/10 text-primary-300 shadow-[0_4px_12px_rgba(0,0,0,0.22)]'
      }`}
      aria-hidden="true"
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}
