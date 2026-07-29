import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteCategoryModalProps {
  deleteConfirmId: string | null;
  onConfirm: (categoryId: string) => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteCategoryModal({
  deleteConfirmId,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteCategoryModalProps) {
  return (
    <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent ariaLabel="Delete Category">
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Channels in this category will become uncategorized. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirmId && onConfirm(deleteConfirmId)}
            disabled={!deleteConfirmId || isDeleting}
            isLoading={isDeleting}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
