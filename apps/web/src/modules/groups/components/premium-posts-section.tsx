/**
 * PremiumPostsSection
 *
 * Embeddable section for group pages that lists premium posts.
 * Fetches posts on mount, supports creating new ones (members only),
 * and displays loading / empty states.
 *
 */

import { useEffect, useState } from 'react';
import { CurrencyDollarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { createLogger } from '@/lib/logger';
import { listPremiumPosts } from '@/modules/groups/services/premium-post-api';
import { PremiumPostCard } from '@/modules/groups/components/premium-post-card';
import { CreatePremiumPostModal } from '@/modules/groups/components/create-premium-post-modal';
import type { PremiumPost } from '@/modules/groups/types/premium-post';

const logger = createLogger('PremiumPostsSection');

interface PremiumPostsSectionProps {
  readonly groupId: string;
  readonly isMember: boolean;
}

function PostSkeleton(): React.JSX.Element {
  return (
    <div className="animate-pulse rounded-xl border border-dark-700 bg-dark-800">
      <div className="flex items-center gap-2.5 border-b border-dark-700 px-4 py-3">
        <div className="h-8 w-8 rounded-full bg-dark-600" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 rounded bg-dark-600" />
          <div className="h-2.5 w-16 rounded bg-dark-600" />
        </div>
        <div className="h-5 w-20 rounded-full bg-dark-600" />
      </div>
      <div className="space-y-2 px-4 py-3">
        <div className="h-4 w-3/4 rounded bg-dark-600" />
        <div className="h-3 w-full rounded bg-dark-600" />
        <div className="h-3 w-5/6 rounded bg-dark-600" />
      </div>
    </div>
  );
}

/** Premium Posts Section. */
export function PremiumPostsSection({
  groupId,
  isMember,
}: PremiumPostsSectionProps): React.JSX.Element {
  const [posts, setPosts] = useState<PremiumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPosts = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const fetched = await listPremiumPosts(groupId);
      setPosts(fetched);
    } catch (err: unknown) {
      logger.error('Failed to fetch premium posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  function handlePurchaseSuccess(updated: PremiumPost): void {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handleCreated(newPost: PremiumPost): void {
    setPosts((prev) => [newPost, ...prev]);
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CurrencyDollarIcon className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Premium Posts</h2>
          {!isLoading && (
            <span className="rounded-full bg-dark-700 px-2 py-0.5 text-xs text-gray-400">
              {posts.length}
            </span>
          )}
        </div>

        {isMember && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-500"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Create Premium Post
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-700 bg-dark-800/50 py-12 text-center">
          <CurrencyDollarIcon className="mb-3 h-10 w-10 text-gray-600" />
          <p className="text-sm text-gray-400">No premium posts yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PremiumPostCard key={post.id} post={post} onPurchaseSuccess={handlePurchaseSuccess} />
          ))}
        </div>
      )}

      {/* Create modal */}
      <CreatePremiumPostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        groupId={groupId}
        onCreated={handleCreated}
      />
    </section>
  );
}
