import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteChannelModalProps {
  deleteConfirmId: string | null;
  onDelete: (channelId: string) => void;
  onClose: () => void;
}

/**
 * Delete Channel Modal dialog component.
 */
export function DeleteChannelModal({
  deleteConfirmId,
  onDelete,
  onClose,
}: DeleteChannelModalProps) {
  return (
    <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent ariaLabel="Delete Channel">
        <DialogHeader>
          <DialogTitle>Delete Channel</DialogTitle>
          <DialogDescription>
            This will permanently delete the channel and all its messages. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirmId && onDelete(deleteConfirmId)}
            disabled={!deleteConfirmId}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
