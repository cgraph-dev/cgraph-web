/**
 * FriendsTab Component
 * Friends list with pending requests and search
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import UserProfileCard from '@/modules/social/components/user-profile-card';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getAvatarBorderId } from '@/lib/utils';
import type { FriendsTabProps } from './types';
import { FADE_UP } from '@/lib/animations/transitions';

/**
 */
/**
 * Friends Tab component.
 */
export function FriendsTab({
  friends,
  pendingRequests,
  sentRequests,
  searchQuery,
  onSearchChange,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onRemoveFriend,
  isLoading,
  error,
  onRetry,
}: FriendsTabProps) {
  const navigate = useNavigate();

  // Show error state with retry button
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <GlassCard variant="frosted" className="max-w-md p-8 text-center">
          <div className="mb-4 text-5xl text-red-400">⚠️</div>
          <h3 className="mb-2 text-xl font-bold text-white">Something went wrong</h3>
          <p className="mb-6 text-gray-400">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/16 rounded-xl border px-8 py-3 text-sm font-bold text-primary-300 shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Try Again
            </button>
          )}
        </GlassCard>
      </div>
    );
  }

  // Show loading state
  if (isLoading && friends.length === 0 && pendingRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <p className="text-gray-400">Loading friends...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar - Optimized for Sidebar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search friends..."
          aria-label="Search friends"
          className="focus:border-primary-500/40 focus:ring-primary-500/20 peer w-full rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] py-3 pl-11 pr-4 text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:placeholder:text-transparent"
        />
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-primary-400/80 mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
            <span className="from-primary-500/30 h-px flex-1 bg-gradient-to-r to-transparent" />
            Pending Requests ({pendingRequests.length})
            <span className="from-primary-500/30 h-px flex-1 bg-gradient-to-l to-transparent" />
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard variant="neon" glow className="p-4">
                  <div className="flex items-center gap-3">
                    <UserProfileCard userId={request.user?.id || ''} trigger="both">
                      <div className="shadow-primary-500/20 ring-primary-500/20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 font-medium text-white shadow-lg ring-2">
                        {request.user?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </UserProfileCard>

                    <div className="flex-1">
                      <p className="font-semibold text-white">
                        {request.user?.displayName || request.user?.username || 'Unknown User'}
                      </p>
                      <p className="text-sm text-white/40">
                        @{request.user?.username || 'unknown'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ opacity: 0.9 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          onAcceptRequest(request.id);
                          HapticFeedback.success();
                        }}
                        className="border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/16 rounded-xl border p-2.5 text-primary-300 shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all"
                        title="Accept"
                        aria-label={`Accept friend request from ${request.user?.displayName || request.user?.username || 'user'}`}
                      >
                        <CheckIcon className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ opacity: 0.9 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          onDeclineRequest(request.id);
                          HapticFeedback.medium();
                        }}
                        className="rounded-xl bg-[var(--token-card-bg)] p-2.5 text-white/60 transition-all hover:bg-red-500/20 hover:text-red-400"
                        title="Decline"
                        aria-label={`Decline friend request from ${request.user?.displayName || request.user?.username || 'user'}`}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/40">
            <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            Sent Requests ({sentRequests.length})
            <span className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
          </h3>
          <div className="space-y-2">
            {sentRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard variant="crystal" className="p-4">
                  <div className="flex items-center gap-3">
                    <UserProfileCard userId={request.user?.id || ''} trigger="both">
                      <div className="shadow-primary-500/20 ring-primary-500/20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 font-medium text-white shadow-lg ring-2">
                        {request.user?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </UserProfileCard>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">
                        {request.user?.displayName || request.user?.username || 'Unknown User'}
                      </p>
                      <p className="truncate text-sm text-white/40">
                        @{request.user?.username || 'unknown'}
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ opacity: 0.9 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onCancelRequest(request.id);
                        HapticFeedback.medium();
                      }}
                      className="rounded-xl bg-[var(--token-card-bg)] p-2.5 text-white/60 transition-all hover:bg-red-500/20 hover:text-red-400"
                      title="Cancel Request"
                      aria-label={`Cancel friend request to ${request.user?.displayName || request.user?.username || 'user'}`}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/40">
          <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          All Friends ({friends.length})
          <span className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
        </h3>
        {friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 px-4 py-12 text-center">
            <p className="text-sm font-bold text-white/20"> No connections found </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {friends.map((friend, index) => (
              <motion.div key={friend.id} {...FADE_UP} transition={{ delay: index * 0.03 }}>
                <GlassCard
                  variant="crystal"
                  className="group cursor-pointer border-[var(--token-border-muted)] p-3 transition-all duration-300 hover:border-[var(--token-card-border)] hover:bg-[var(--token-bg-primary)]"
                >
                  <div className="flex items-center gap-3">
                    <UserProfileCard userId={friend.id} trigger="both">
                      <div className="relative flex-shrink-0">
                        <ThemedAvatar
                          src={friend.avatarUrl}
                          alt={friend.displayName || friend.username}
                          size="medium"
                          className="h-12 w-12 ring-2 ring-white/[0.08]"
                          avatarBorderId={getAvatarBorderId(friend)}
                        />
                        {friend.status === 'online' && (
                          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40 ring-2 ring-dark-900" />
                        )}
                      </div>
                    </UserProfileCard>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">
                        {friend.displayName || friend.username}
                      </p>
                      <p className="truncate text-sm text-white/40">@{friend.username}</p>
                    </div>

                    <motion.button
                      whileHover={{ opacity: 0.9 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/messages?userId=${friend.id}`);
                        HapticFeedback.medium();
                      }}
                      className="hover:bg-primary-500/10 hover:border-primary-500/20 focus-visible:ring-primary-300/70 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] text-white/55 opacity-100 backdrop-blur-md transition-all hover:text-primary-300 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--token-bg-primary)] sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                      title="Send Message"
                      aria-label={`Message ${friend.displayName || friend.username}`}
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ opacity: 0.9 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFriend(friend.friendshipId);
                        HapticFeedback.medium();
                      }}
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] text-white/45 opacity-100 backdrop-blur-md transition-all hover:border-red-500/25 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--token-bg-primary)] sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                      title="Remove Friend"
                      aria-label={`Remove ${friend.displayName || friend.username} from friends`}
                    >
                      <UserMinusIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
