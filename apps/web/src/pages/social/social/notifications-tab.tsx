/**
 * NotificationsTab Component
 * Notifications list with mark as read functionality
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { getNotificationIcon, formatTimeAgo } from './utils';
import type { NotificationsTabProps } from './types';

export function NotificationsTab({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsTabProps) {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          {unreadCount > 0 ? `${unreadCount} Unread` : 'All Caught Up'}
          <span className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
        </h3>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="w-full rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] py-2.5 text-xs font-black uppercase tracking-widest text-white/40 transition-all hover:bg-[var(--token-bg-secondary)] hover:text-white active:scale-[0.98]"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <GlassCard variant="frosted" className="relative overflow-hidden py-12 px-6 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/[0.06] blur-[50px]" />
          </div>
          <div className="relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--token-bg-primary)] ring-1 ring-white/[0.06]">
              <BellIconSolid className="h-8 w-8 text-primary-400/40" />
            </div>
            <h4 className="mb-1 text-sm font-bold text-white/80">All clear</h4>
            <p className="text-xs text-white/20">
              No new notifications at this time.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group"
            >
              <GlassCard
                variant="crystal"
                className={`cursor-pointer border-[var(--token-border-muted)] p-3 transition-all duration-300 hover:bg-[var(--token-bg-primary)] hover:border-[var(--token-card-border)] ${
                  notification.read ? 'opacity-40' : 'opacity-100'
                }`}
                onClick={() => {
                  onMarkAsRead(notification.id);
                  if (notification.actionUrl) {
                    navigate(notification.actionUrl);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon Container */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-500 ${
                      notification.read
                        ? 'bg-[var(--token-bg-primary)] border-transparent text-white/20'
                        : 'border-primary-500/20 bg-primary-500/10 text-primary-400 shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <h4 className={`truncate text-sm font-bold transition-colors ${notification.read ? 'text-white/40' : 'text-white'}`}>
                        {notification.title}
                      </h4>
                      <span className="shrink-0 text-[10px] font-medium text-white/20">
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                    </div>
                    <p className={`line-clamp-2 text-xs leading-relaxed transition-colors ${notification.read ? 'text-white/20' : 'text-white/60'}`}>
                      {notification.message}
                    </p>

                    {!notification.read && (
                      <div className="mt-2 h-0.5 w-8 rounded-full bg-primary-500/40" />
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
