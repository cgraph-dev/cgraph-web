import {
  FolderIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Button, IconButton } from '@/components/ui/button';
import Card from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export interface Category {
  id: string;
  name: string;
  position: number;
  channelCount: number;
}

interface CategoryListItemProps {
  category: Category;
  index: number;
  totalCount: number;
  isEditing: boolean;
  editName: string;
  onEditNameChange: (name: string) => void;
  onSave: (categoryId: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (category: Category) => void;
  onDeleteRequest: (categoryId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  disabled?: boolean;
  saving?: boolean;
}

export function CategoryListItem({
  category,
  index,
  totalCount,
  isEditing,
  editName,
  onEditNameChange,
  onSave,
  onCancelEdit,
  onStartEdit,
  onDeleteRequest,
  onMoveUp,
  onMoveDown,
  disabled = false,
  saving = false,
}: CategoryListItemProps) {
  return (
    <Card>
      {isEditing ? (
        <div className="flex flex-wrap items-center gap-2">
          <FolderIcon
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-[var(--token-text-muted)]"
          />
          <Input
            aria-label={`Category name for ${category.name}`}
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave(category.id);
              if (e.key === 'Escape') onCancelEdit();
            }}
            size="sm"
            className="min-h-9 min-w-48 flex-1"
            disabled={disabled}
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => onSave(category.id)}
            disabled={disabled || !editName.trim()}
            isLoading={saving}
          >
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancelEdit} disabled={disabled}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <FolderIcon
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-[var(--token-text-muted)]"
            />
            <span className="truncate text-sm font-medium text-[var(--token-text-primary)]">
              {category.name}
            </span>
            <span className="whitespace-nowrap text-xs text-[var(--token-text-muted)]">
              {category.channelCount} channel
              {category.channelCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <IconButton
              icon={<ChevronUpIcon aria-hidden="true" />}
              label={`Move ${category.name} up`}
              size="sm"
              onClick={() => onMoveUp(index)}
              disabled={disabled || index === 0}
            />
            <IconButton
              icon={<ChevronDownIcon aria-hidden="true" />}
              label={`Move ${category.name} down`}
              size="sm"
              onClick={() => onMoveDown(index)}
              disabled={disabled || index === totalCount - 1}
            />
            <IconButton
              icon={<PencilIcon aria-hidden="true" />}
              label={`Edit ${category.name}`}
              size="sm"
              disabled={disabled}
              onClick={() => onStartEdit(category)}
            />
            <IconButton
              icon={<TrashIcon aria-hidden="true" />}
              label={`Delete ${category.name}`}
              variant="danger"
              size="sm"
              disabled={disabled}
              onClick={() => onDeleteRequest(category.id)}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
