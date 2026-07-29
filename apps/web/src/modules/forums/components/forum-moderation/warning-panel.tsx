import { useState } from 'react';
import { AlertTriangle, Search, Send } from 'lucide-react';
import { createLogger } from '@/lib/logger';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  Input,
  Textarea,
  toast,
} from '@/shared/components/ui';

const logger = createLogger('WarningPanel');

interface WarningPanelProps {
  forumId: string;
}

interface ForumWarning {
  id: string;
  reason: string;
  points: number;
  expires_at: string | null;
  acknowledged: boolean;
  revoked: boolean;
  issued_by_id: string;
  inserted_at: string;
}

function getWarningSummary(totalPoints: number): {
  variant: 'default' | 'warning' | 'error';
  threshold?: string;
} {
  if (totalPoints >= 10) {
    return { variant: 'error', threshold: 'Permanent ban threshold' };
  }
  if (totalPoints >= 6) {
    return { variant: 'warning', threshold: 'Temporary ban threshold (7 days)' };
  }
  if (totalPoints >= 3) {
    return { variant: 'warning', threshold: 'Mute threshold (24 hours)' };
  }
  return { variant: 'default' };
}

export default function WarningPanel({ forumId }: WarningPanelProps) {
  const [userId, setUserId] = useState('');
  const [warnings, setWarnings] = useState<ForumWarning[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [warnReason, setWarnReason] = useState('');
  const [warnPoints, setWarnPoints] = useState(1);
  const [isIssuing, setIsIssuing] = useState(false);

  const normalizedUserId = userId.trim();

  const loadWarnings = async () => {
    if (!normalizedUserId) return;

    setIsLoading(true);
    try {
      const { api: http } = await import('@/lib/api');
      const response = await http.get(
        `/api/v1/forums/${forumId}/moderation/warnings?user_id=${encodeURIComponent(normalizedUserId)}`
      );
      setWarnings(response.data?.data ?? []);
      setTotalPoints(response.data?.total_points ?? 0);
      setHasLoaded(true);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'loadWarnings');
      toast.error('Failed to load warnings');
    } finally {
      setIsLoading(false);
    }
  };

  const issueWarning = async () => {
    const normalizedReason = warnReason.trim();
    if (!normalizedUserId || !normalizedReason) {
      toast.error('User ID and reason are required');
      return;
    }

    setIsIssuing(true);
    try {
      const { api: http } = await import('@/lib/api');
      await http.post(`/api/v1/forums/${forumId}/moderation/warn`, {
        user_id: normalizedUserId,
        reason: normalizedReason,
        points: warnPoints,
      });
      toast.success('Warning issued');
      setWarnReason('');
      setWarnPoints(1);
      await loadWarnings();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'issueWarning');
      toast.error('Failed to issue warning');
    } finally {
      setIsIssuing(false);
    }
  };

  const summary = getWarningSummary(totalPoints);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          label="User ID"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void loadWarnings();
          }}
          placeholder="Enter user ID"
          leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
        />
        <Button
          className="self-end sm:min-w-28"
          disabled={!normalizedUserId}
          isLoading={isLoading}
          onClick={() => void loadWarnings()}
        >
          {isLoading ? 'Loading…' : 'Look Up'}
        </Button>
      </div>

      {hasLoaded && totalPoints > 0 && (
        <Alert variant={summary.variant}>
          <AlertTitle>Active warning points: {totalPoints}</AlertTitle>
          {summary.threshold && <AlertDescription>{summary.threshold}</AlertDescription>}
        </Alert>
      )}

      {normalizedUserId && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle
              className="h-5 w-5 text-[var(--token-feedback-warning)]"
              aria-hidden="true"
            />
            <h4 className="font-semibold text-[var(--token-text-primary)]">Issue warning</h4>
          </div>
          <div className="space-y-3">
            <Textarea
              label="Reason"
              value={warnReason}
              onChange={(event) => setWarnReason(event.target.value)}
              placeholder="Describe the moderation reason"
              rows={3}
              required
            />
            <div className="flex flex-col items-end gap-3 sm:flex-row">
              <Input
                className="sm:max-w-28"
                label="Points (1–5)"
                type="number"
                min={1}
                max={5}
                value={warnPoints}
                onChange={(event) =>
                  setWarnPoints(Math.min(5, Math.max(1, Number(event.target.value))))
                }
              />
              <Button
                className="sm:min-w-36"
                variant="danger"
                leftIcon={<Send aria-hidden="true" />}
                disabled={!warnReason.trim()}
                isLoading={isIssuing}
                onClick={() => void issueWarning()}
              >
                {isIssuing ? 'Issuing…' : 'Issue Warning'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {hasLoaded && warnings.length === 0 && (
        <Card className="text-center">
          <p className="text-sm font-medium text-[var(--token-text-primary)]">No warning history</p>
          <p className="mt-1 text-sm text-[var(--token-text-muted)]">
            This user has no forum warnings.
          </p>
        </Card>
      )}

      {warnings.length > 0 && (
        <section className="space-y-2" aria-labelledby="warning-history-title">
          <h4
            id="warning-history-title"
            className="font-semibold text-[var(--token-text-primary)]"
          >
            Warning history
          </h4>
          {warnings.map((warning) => (
            <Card key={warning.id} className={warning.revoked ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-[var(--token-text-primary)]">
                    {warning.reason}
                  </p>
                  <p className="mt-1 text-xs text-[var(--token-text-muted)]">
                    {new Date(warning.inserted_at).toLocaleString()}
                    {warning.expires_at &&
                      ` · Expires ${new Date(warning.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
                <Badge variant={warning.revoked ? 'secondary' : 'danger'}>
                  {warning.revoked
                    ? 'Revoked'
                    : `${warning.points} point${warning.points === 1 ? '' : 's'}`}
                </Badge>
              </div>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
