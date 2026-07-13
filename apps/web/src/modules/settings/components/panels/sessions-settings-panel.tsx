/**
 * Active sessions management panel.
 */
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  GlassCard,
} from '@/shared/components/ui';
import { useSessions } from '@/modules/auth/hooks';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';

// Helper functions
function formatLastActive(dateString: string | null): string {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

function parseBrowser(userAgent: string | null): string {
  if (!userAgent) return 'Unknown Browser';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Microsoft Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown Browser';
}

function getDeviceIcon(userAgent: string | null) {
  const d = userAgent?.toLowerCase() ?? '';
  if (d.includes('iphone') || d.includes('android') || d.includes('mobile'))
    return DevicePhoneMobileIcon;
  if (d.includes('ipad') || d.includes('tablet')) return DeviceTabletIcon;
  if (d.includes('mac') || d.includes('windows') || d.includes('linux') || d.includes('desktop'))
    return ComputerDesktopIcon;
  return GlobeAltIcon;
}

/**
 * Sessions Settings Panel component.
 */
export function SessionsSettingsPanel() {
  const { sessions, isLoading, isMutating, error, getSessions, revokeSession, revokeAllOtherSessions } =
    useSessions();
  const [pendingRevocation, setPendingRevocation] = useState<string | 'all' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void getSessions();
  }, [getSessions]);

  const confirmRevocation = async () => {
    if (!pendingRevocation) return;

    setSuccessMessage(null);

    const revoked =
      pendingRevocation === 'all'
        ? await revokeAllOtherSessions()
        : await revokeSession(pendingRevocation);

    if (revoked) {
      setSuccessMessage(
        pendingRevocation === 'all'
          ? 'Other active sessions were revoked.'
          : 'The selected session was revoked.'
      );
      setPendingRevocation(null);
    }
  };

  const isBulkRevocation = pendingRevocation === 'all';
  const otherSessions = sessions.filter((session) => !session.current);

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} transition={tweens.standard}>
      <h1 className="mb-6 bg-gradient-to-r from-[var(--token-text-primary)] via-primary-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
        Active Sessions
      </h1>

      {error && (
        <p className="mb-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="mb-4 text-sm text-emerald-300" role="status">
          {successMessage}
        </p>
      )}

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <GlassCard variant="default" className="p-6 text-center">
            <p className="text-[var(--token-text-muted)]">No active sessions found</p>
          </GlassCard>
        ) : (
          sessions.map((session) => (
            <GlassCard
              key={session.id}
              variant={session.current ? 'crystal' : 'default'}
              className="p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {(() => {
                    const DeviceIcon = getDeviceIcon(session.user_agent);
                    return (
                      <DeviceIcon
                        className={`h-8 w-8 ${session.current ? 'text-primary-500' : 'text-[var(--token-text-muted)]'}`}
                      />
                    );
                  })()}
                  <div>
                    <h3 className="font-medium text-[var(--token-text-primary)]">
                      {parseBrowser(session.user_agent)}
                      {session.current && (
                        <span className="ml-2 text-xs font-semibold text-primary-300">
                          (Current)
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-[var(--token-text-muted)]">
                      {session.location ?? 'Unknown location'} •{' '}
                      {formatLastActive(session.last_active_at ?? session.created_at)}
                    </p>
                    {session.ip && (
                      <p className="font-mono text-xs text-[var(--token-text-muted)]">
                        {session.ip}
                      </p>
                    )}
                  </div>
                </div>
                {!session.current && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => {
                      setSuccessMessage(null);
                      setPendingRevocation(session.id);
                    }}
                    disabled={isMutating}
                    className="rounded-lg bg-red-600/20 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
                  >
                    Revoke
                  </motion.button>
                )}
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {otherSessions.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            setSuccessMessage(null);
            setPendingRevocation('all');
          }}
          disabled={isMutating}
          className="mt-6 rounded-lg bg-red-600/20 px-4 py-2 font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
        >
          Revoke All Other Sessions
        </motion.button>
      )}

      <Dialog
        open={pendingRevocation !== null}
        onOpenChange={(open) => {
          if (!open && !isMutating) setPendingRevocation(null);
        }}
      >
        <DialogContent ariaLabel="Confirm session revocation">
          <DialogHeader>
            <DialogTitle>
              {isBulkRevocation ? 'Revoke all other sessions?' : 'Revoke this session?'}
            </DialogTitle>
            <DialogDescription>
              {isBulkRevocation
                ? 'All sessions except this device will be signed out.'
                : 'This device will be signed out immediately.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingRevocation(null)}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={confirmRevocation} isLoading={isMutating}>
              {isBulkRevocation ? 'Revoke other sessions' : 'Revoke session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
