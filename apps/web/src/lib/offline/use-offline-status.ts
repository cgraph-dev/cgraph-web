import { useState, useEffect } from 'react';
import { runSync, onStatusChange, onSyncComplete, type SyncStats } from './sync-service';
import { getPendingMessages } from './indexeddb-cache';

export interface OfflineStatus {
  readonly isOnline: boolean;
  readonly pendingCount: number;
  readonly isSyncing: boolean;
  readonly lastSync: SyncStats | null;
  readonly triggerSync: () => Promise<void>;
}

/** Use Offline Status. */
export function useOfflineStatus(): OfflineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncStats | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', refreshPendingCount);

    const unsubStatus = onStatusChange(setIsOnline);
    const unsubSync = onSyncComplete((stats) => {
      setLastSync(stats);
      setIsSyncing(false);
      refreshPendingCount();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', refreshPendingCount);
      unsubStatus();
      unsubSync();
    };
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, []);

  function refreshPendingCount(): void {
    getPendingMessages()
      .then((messages) => setPendingCount(messages.length))
      .catch(() => setPendingCount(0));
  }

  async function triggerSync(): Promise<void> {
    setIsSyncing(true);
    try {
      await runSync();
    } finally {
      setIsSyncing(false);
      refreshPendingCount();
    }
  }

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSync,
    triggerSync,
  };
}
