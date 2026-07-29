import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, Textarea } from '@/components/ui/input';
import type { MemberAction } from './types';

interface ConfirmActionModalProps {
  action: MemberAction;
  memberId: string;
  banDuration: string;
  reason: string;
  error: string | null;
  isSubmitting: boolean;
  onBanDurationChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onConfirm: (memberId: string, action: MemberAction) => void;
  onClose: () => void;
}

const ACTION_COPY: Record<
  Exclude<MemberAction, 'none'>,
  { title: string; description: string; label: string }
> = {
  kick: {
    title: 'Kick member',
    description: 'This member will be removed from the group. They can rejoin with an invite.',
    label: 'Kick',
  },
  ban: {
    title: 'Ban member',
    description: 'This member cannot rejoin until the ban expires or is removed.',
    label: 'Ban',
  },
  mute: {
    title: 'Mute member',
    description: 'This member will be unable to send messages for 10 minutes.',
    label: 'Mute',
  },
};

const BAN_DURATION_OPTIONS = [
  { value: 'permanent', label: 'Permanent' },
  { value: '1', label: '1 hour' },
  { value: '24', label: '24 hours' },
  { value: '168', label: '7 days' },
  { value: '720', label: '30 days' },
];

export function ConfirmActionModal({
  action,
  memberId,
  banDuration,
  reason,
  error,
  isSubmitting,
  onBanDurationChange,
  onReasonChange,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  const copy = action === 'none' ? null : ACTION_COPY[action];

  return (
    <Dialog
      open={copy !== null}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      {copy && (
        <DialogContent ariaLabel={copy.title}>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <p
                role="alert"
                className="cgraph-section-surface border-[var(--token-feedback-error)] px-3 py-2 text-sm text-[var(--token-feedback-error)]"
              >
                {error}
              </p>
            )}
            {action === 'ban' && (
              <Select
                label="Ban duration"
                value={banDuration}
                disabled={isSubmitting}
                options={BAN_DURATION_OPTIONS}
                onChange={(event) => onBanDurationChange(event.target.value)}
              />
            )}
            <Textarea
              label="Reason"
              hint="Optional. This is saved in the group audit log."
              value={reason}
              rows={3}
              disabled={isSubmitting}
              onChange={(event) => onReasonChange(event.target.value)}
              className="min-h-20"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" disabled={isSubmitting} onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant={action === 'mute' ? 'secondary' : 'danger'}
              isLoading={isSubmitting}
              onClick={() => onConfirm(memberId, action)}
            >
              {copy.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
