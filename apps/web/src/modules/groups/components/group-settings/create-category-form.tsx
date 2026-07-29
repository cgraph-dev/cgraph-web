import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button, IconButton } from '@/components/ui/button';
import Card from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface CreateCategoryFormProps {
  show: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  disabled?: boolean;
}

export function CreateCategoryForm({
  show,
  name,
  onNameChange,
  onSubmit,
  onClose,
  disabled = false,
}: CreateCategoryFormProps) {
  if (!show) return null;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-[var(--token-text-primary)]">New Category</h4>
        <IconButton
          icon={<XMarkIcon aria-hidden="true" />}
          label="Close category form"
          size="sm"
          disabled={disabled}
          onClick={onClose}
        />
      </div>
      <Input
        label="Category name"
        placeholder="Category name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        disabled={disabled}
        autoFocus
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={onSubmit} isLoading={disabled} disabled={disabled || !name.trim()}>
          Create
        </Button>
      </div>
    </Card>
  );
}
