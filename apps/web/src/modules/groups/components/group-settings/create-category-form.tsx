import { XMarkIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { Button, IconButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateCategoryFormProps {
  show: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

/**
 * Create Category Form component.
 */
export function CreateCategoryForm({
  show,
  name,
  onNameChange,
  onSubmit,
  onClose,
}: CreateCategoryFormProps) {
  if (!show) return null;

  return (
    <GlassCard variant="frosted" className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">New Category</h4>
        <IconButton
          icon={<XMarkIcon />}
          label="Close category form"
          size="sm"
          onClick={onClose}
        />
      </div>
      <Input
        label="Category name"
        placeholder="Category name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        autoFocus
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={onSubmit} disabled={!name.trim()}>
          Create
        </Button>
      </div>
    </GlassCard>
  );
}
