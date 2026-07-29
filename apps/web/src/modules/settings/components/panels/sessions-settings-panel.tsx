/**
 * Active sessions management panel.
 */
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Globe2, Monitor, Smartphone, Tablet } from 'lucide-react';
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
import { InlineLoadingSpinner } from '@/components/feedback/loading-spinner';
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
  if (userAgent.includes('Edg/')) return 'Microsoft Edge';
  if (userAgent.includes('OPR/') || userAgent.includes('Opera')) return 'Opera';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  return 'Unknown Browser';
}

function getDeviceIcon(userAgent: string | null) {
  const d = userAgent?.toLowerCase() ?? '';
  if (d.includes('iphone') || d.includes('android') || d.includes('mobile'))
    return Smartphone;
  if (d.includes('ipad') || d.includes('tablet')) return Tablet;
  if (d.includes('mac') || d.includes('windows') || d.includes('linux') || d.includes('desktop'))
    return Monitor;
  return Globe2;
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
  const currentSessions = sessions.filter((session) => session.current);
  const otherSessions = sessions.filter((session) => !session.current);
  const orderedSessions = [...currentSessions, ...otherSessions];

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <InlineLoadingSpinner label="Loading active sessions" size="lg" />
      </div>
    );
  }

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} transition={tweens.standard}>
      <h1 className="mb-6 text-2xl font-semibold text-[var(--token-text-primary)]">
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
          orderedSessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session.user_agent);

            return (
              <GlassCard
                key={session.id}
                variant={session.current ? 'crystal' : 'default'}
                className="p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <DeviceIcon
                      aria-hidden="true"
                      className={`h-8 w-8 shrink-0 ${session.current ? 'text-primary-500' : 'text-[var(--token-text-muted)]'}`}
                    />
                    <div className="min-w-0">
                      <h2 className="font-medium text-[var(--token-text-primary)]">
                        {parseBrowser(session.user_agent)}
                        {session.current && (
                          <span className="ml-2 text-xs font-semibold text-primary-300">
                            (Current)
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-[var(--token-text-muted)]">
                        {session.location ?? 'Unknown location'} •{' '}
                        {formatLastActive(session.last_active_at ?? session.created_at)}
                      </p>
                      {session.ip && (
                        <p className="break-all font-mono text-xs text-[var(--token-text-muted)]">
                          {session.ip}
                        </p>
                      )}
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      animated={false}
                      onClick={() => {
                        setSuccessMessage(null);
                        setPendingRevocation(session.id);
                      }}
                      disabled={isMutating}
                      className="shrink-0 self-end sm:self-auto"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {otherSessions.length > 0 && (
        <Button
          type="button"
          variant="danger"
          animated={false}
          onClick={() => {
            setSuccessMessage(null);
            setPendingRevocation('all');
          }}
          disabled={isMutating}
          className="mt-6"
        >
          Revoke All Other Sessions
        </Button>
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
              animated={false}
              onClick={() => setPendingRevocation(null)}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              animated={false}
              onClick={confirmRevocation}
              isLoading={isMutating}
            >
              {isBulkRevocation ? 'Revoke other sessions' : 'Revoke session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
