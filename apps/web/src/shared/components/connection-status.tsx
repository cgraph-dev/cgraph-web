import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  useConnectionStatusStore,
  type ConnectionStatus as SocketConnectionStatus,
} from '@/lib/socket/connection-status-store';

type ConnectionState = 'connected' | 'reconnecting' | 'offline';

const STATE_CONFIG: Record<ConnectionState, { color: string; label: string; pulse: boolean }> = {
  connected: { color: 'bg-emerald-400', label: 'Connected', pulse: false },
  reconnecting: { color: 'bg-amber-400', label: 'Reconnecting...', pulse: true },
  offline: { color: 'bg-red-400', label: 'Offline', pulse: false },
};

function toConnectionState(status: SocketConnectionStatus, isOnline: boolean): ConnectionState {
  if (!isOnline) return 'offline';
  return status === 'connected' ? 'connected' : 'reconnecting';
}

/** Connection Status. */
export function ConnectionStatus() {
  const socketStatus = useConnectionStatusStore((s) => s.status);
  const [state, setState] = useState<ConnectionState>('connected');
  const [showLabel, setShowLabel] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function applyConnectionState(): void {
      const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
      setState(toConnectionState(socketStatus, isOnline));
    }

    applyConnectionState();
    const handleOnline = () => applyConnectionState();
    const handleOffline = () => setState('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [socketStatus]);

  useEffect(() => {
    if (state !== 'connected') {
      setShowLabel(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    } else {
      hideTimeoutRef.current = setTimeout(() => setShowLabel(false), 2000);
    }

    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [state]);

  const config = STATE_CONFIG[state];

  return (
    <div
      className="flex items-center gap-1.5"
      title={config.label}
      role="status"
      aria-label={`Connection status: ${config.label}`}
    >
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.color} opacity-75`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${config.color}`} />
      </span>

      <AnimatePresence>
        {showLabel && state !== 'connected' && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap text-xs text-neutral-400"
          >
            {config.label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
