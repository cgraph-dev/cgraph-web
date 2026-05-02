/**
 * Thread Viewers Component — C3
 *
 * Shows users currently viewing this thread, powered by
 * Phoenix Presence via the thread channel socket.
 */

import { useEffect, useState, useCallback } from 'react';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { socketManager } from '@/lib/socket';
import type { ThreadViewerPayload } from '@/lib/socket/types';

interface ThreadViewersProps {
  threadId: string;
}

const MAX_DISPLAYED = 5;

/** Displays avatars of users currently viewing a thread. */
export function ThreadViewers({ threadId }: ThreadViewersProps) {
  const [viewers, setViewers] = useState<ThreadViewerPayload[]>([]);

  const handlePresenceSync = useCallback((updated: ThreadViewerPayload[]) => {
    setViewers(updated);
  }, []);

  useEffect(() => {
    // Join the thread channel with presence callback
    socketManager.joinThread(threadId, {
      onPresenceSync: handlePresenceSync,
    });

    // Fetch initial viewer list
    socketManager
      .getThreadViewers(threadId)
      .then((result) => {
        if (result?.viewers) {
          setViewers(result.viewers);
        }
      })
      .catch(() => {
        // Viewer list is non-critical, fail silently
      });

    return () => {
      socketManager.leaveThread(threadId);
    };
  }, [threadId, handlePresenceSync]);

  if (viewers.length === 0) return null;

  const displayed = viewers.slice(0, MAX_DISPLAYED);
  const remaining = viewers.length - MAX_DISPLAYED;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-400">
      <span className="font-medium text-gray-300">Viewing:</span>
      <div className="flex -space-x-1.5">
        {displayed.map((viewer) => (
          <ThemedAvatar
            key={viewer.user_id}
            src={viewer.avatar_url ?? null}
            alt={viewer.display_name ?? viewer.username}
            size="xs"
            avatarBorderId={null}
          />
        ))}
      </div>
      <span>
        {displayed.map((v) => v.display_name ?? v.username).join(', ')}
        {remaining > 0 && ` and ${remaining} more`}
      </span>
    </div>
  );
}
