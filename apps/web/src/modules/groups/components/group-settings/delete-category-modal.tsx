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
}

/**
 * Delete Category Modal dialog component.
 */
export function DeleteCategoryModal({
  deleteConfirmId,
  onConfirm,
  onCancel,
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
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirmId && onConfirm(deleteConfirmId)}
            disabled={!deleteConfirmId}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
