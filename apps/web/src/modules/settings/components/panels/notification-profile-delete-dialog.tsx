import { useId } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui';

interface NotificationProfileDeleteDialogProps {
  readonly profileName: string;
  readonly open: boolean;
  readonly isDeleting: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
}

/** Shared destructive confirmation for notification-profile deletion. */
export function NotificationProfileDeleteDialog({
  profileName,
  open,
  isDeleting,
  onOpenChange,
  onConfirm,
}: NotificationProfileDeleteDialogProps): React.ReactNode {
  const titleId = useId();
  const descriptionId = useId();

  function handleOpenChange(nextOpen: boolean): void {
    if (!isDeleting) {
      onOpenChange(nextOpen);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent ariaLabelledBy={titleId} ariaDescribedBy={descriptionId}>
        <DialogHeader>
          <DialogTitle>
            <span id={titleId}>Delete notification profile?</span>
          </DialogTitle>
          <DialogDescription>
            <span id={descriptionId}>
              Delete “{profileName}”? Its schedule and notification exceptions will be removed.
              This cannot be undone.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
            autoFocus
            animated={false}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            leftIcon={<TrashIcon aria-hidden="true" />}
            onClick={onConfirm}
            isLoading={isDeleting}
            animated={false}
          >
            Delete profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
