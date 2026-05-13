/**
 * DiscoverTab Component
 * Search and discover users, forums, and groups
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useFriendStore } from '@/modules/social/store';
import type { Friend, FriendRequest } from '@/modules/social/store';
import { useAuthStore } from '@/modules/auth/store';
import { getSearchResultIcon } from './utils';
import { getDiscoverResultRoute } from './discover-routing';
import type { DiscoverTabProps } from './types';
import { FADE_UP } from '@/lib/animations/transitions';
import { loop, tweens } from '@/lib/animation-presets';

/**
 */
/**
 * Discover Tab component.
 */
export function DiscoverTab({ searchQuery, searchResults, onSearchChange }: DiscoverTabProps) {
  const navigate = useNavigate();
  const { sendRequest, friends, sentRequests, pendingRequests } = useFriendStore();
  const { user: currentUser } = useAuthStore();

  return (
    <div className="space-y-5">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search CGraph..."
          className="focus:border-primary-500/40 focus:ring-primary-500/10 peer w-full rounded-2xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] py-3.5 pl-12 pr-4 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:bg-[var(--token-card-bg)] focus:outline-none focus:ring-4"
        />
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
      </div>

      {/* Search Results */}
      {searchQuery.length === 0 ? (
        <GlassCard
          variant="holographic"
          className="relative overflow-hidden px-6 py-10 text-center"
        >
          <div className="relative z-10">
            <motion.div
              initial={{ rotate: 0, scale: 1 }}
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={loop(tweens.glacial)}
              className="relative mb-5 inline-block"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--token-bg-primary)] ring-1 ring-white/[0.1]">
                <MagnifyingGlassIcon className="h-8 w-8 text-primary-400" />
              </div>
            </motion.div>

            <h3 className="mb-1 text-base font-bold text-white">Discover</h3>
            <p className="text-xs text-white/30">Users, forums, and groups</p>
          </div>
        </GlassCard>
      ) : searchResults.length === 0 ? (
        <GlassCard variant="frosted" className="p-8 text-center">
          <p className="text-sm text-white/40">No results found</p>
        </GlassCard>
      ) : (
        <div className="space-y-1.5">
          <h3 className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            {searchResults.length} Results
            <span className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
          </h3>
          {searchResults.map((result, index) => (
            <motion.div key={result.id} {...FADE_UP} transition={{ delay: index * 0.03 }}>
              <GlassCard
                variant="crystal"
                className="cursor-pointer space-y-3 p-3 transition-all duration-300 hover:border-[var(--token-card-border)] hover:bg-[var(--token-bg-primary)]"
                onClick={() => {
                  navigate(getDiscoverResultRoute(result));
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--token-bg-secondary)] text-xl ring-1 ring-white/[0.06]">
                    {getSearchResultIcon(result.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-bold text-white">{result.name}</h4>
                    <p className="truncate text-[11px] text-white/40">{result.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[var(--token-border-muted)] pt-3">
                  {result.memberCount ? (
                    <span className="text-[10px] font-medium text-white/20">
                      {result.memberCount.toLocaleString()} members
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/20">
                      {result.type}
                    </span>
                  )}

                  {result.type === 'user' && result.id !== currentUser?.id ? (
                    (() => {
                      const isFriend = friends.some((f: Friend) => f.id === result.id);
                      const isPending =
                        sentRequests.some((r: FriendRequest) => r.user.id === result.id) ||
                        pendingRequests.some((r: FriendRequest) => r.user.id === result.id);
                      return (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!isFriend && !isPending) {
                              try {
                                await sendRequest(result.id);
                                HapticFeedback.success();
                              } catch {
                                HapticFeedback.error();
                              }
                            }
                          }}
                          className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                            isFriend || isPending
                              ? 'cursor-default bg-[var(--token-card-bg)] text-white/20'
                              : 'bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 active:scale-[0.95]'
                          }`}
                          disabled={isFriend || isPending}
                        >
                          {isFriend ? 'Connected' : isPending ? 'Pending' : 'Add'}
                        </button>
                      );
                    })()
                  ) : result.type !== 'user' ? (
                    <span
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-widest ${
                        result.isJoined
                          ? 'bg-[var(--token-card-bg)] text-white/20'
                          : 'bg-primary-500/10 text-primary-400'
                      }`}
                    >
                      {result.isJoined ? 'Joined' : 'Open'}
                    </span>
                  ) : null}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
