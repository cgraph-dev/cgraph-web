import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { GroupInviteView, InviteOperationResult } from './types';

interface DeleteInviteDialogProps {
  invite: GroupInviteView | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (inviteId: string) => Promise<InviteOperationResult<undefined>>;
}

export function DeleteInviteDialog({
  invite,
  isDeleting,
  onOpenChange,
  onDelete,
}: DeleteInviteDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const close = () => {
    if (isDeleting) return;
    setErrorMessage(null);
    onOpenChange(false);
  };

  const confirm = async () => {
    if (!invite) return;
    setErrorMessage(null);
    const result = await onDelete(invite.id);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    close();
  };

  return (
    <Dialog open={Boolean(invite)} onOpenChange={(open) => !open && close()}>
      <DialogContent
        ariaLabel="Delete invite link"
      >
        <DialogHeader>
          <DialogTitle>Delete invite link?</DialogTitle>
          <DialogDescription>
            Link {invite?.code} will stop working immediately. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-lg border border-[var(--token-feedback-error)]/40 bg-[var(--token-feedback-error)]/10 px-3 py-2 text-sm text-[var(--token-feedback-error)]"
          >
            {errorMessage}
          </p>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button variant="ghost" onClick={close} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            leftIcon={<TrashIcon />}
            isLoading={isDeleting}
            disabled={isDeleting}
            onClick={confirm}
          >
            Delete link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
