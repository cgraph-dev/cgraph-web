import { motion, AnimatePresence } from 'motion/react';
import { WifiIcon, ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useOfflineStatus } from '@/lib/offline/use-offline-status';

/** Offline Indicator. */
export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineStatus();

  const showBanner = !isOnline || pendingCount > 0;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="overflow-hidden"
        >
          <div
            className={`flex items-center justify-between px-4 py-2 text-sm ${
              isOnline
                ? 'border-b border-amber-500/20 bg-amber-500/10 text-amber-300'
                : 'border-b border-red-500/20 bg-red-500/10 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {!isOnline ? (
                <>
                  <WifiIcon className="h-4 w-4" />
                  <span>You&apos;re offline. Messages will be sent when you reconnect.</span>
                </>
              ) : (
                <>
                  <ClockIcon className="h-4 w-4" />
                  <span>
                    {pendingCount} message{pendingCount !== 1 ? 's' : ''} queued
                  </span>
                </>
              )}
            </div>

            {isOnline && pendingCount > 0 && (
              <button
                type="button"
                onClick={triggerSync}
                disabled={isSyncing}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync now'}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
