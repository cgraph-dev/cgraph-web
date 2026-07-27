import {
  FolderIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { Button, IconButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface Category {
  id: string;
  name: string;
  position: number;
  isCollapsed: boolean;
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
}

/**
 * Category List Item component.
 */
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
}: CategoryListItemProps) {
  return (
    <GlassCard variant="frosted" className="px-4 py-3">
      {isEditing ? (
        <div className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5 shrink-0 text-gray-400" />
          <Input
            aria-label={`Category name for ${category.name}`}
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave(category.id);
              if (e.key === 'Escape') onCancelEdit();
            }}
            size="sm"
            className="min-h-9 flex-1"
            autoFocus
          />
          <Button size="sm" onClick={() => onSave(category.id)}>
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancelEdit}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium uppercase tracking-wider text-gray-300">
              {category.name}
            </span>
            <span className="text-xs text-gray-600">
              {category.channelCount} channel
              {category.channelCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <IconButton
              icon={<ChevronUpIcon />}
              label={`Move ${category.name} up`}
              size="sm"
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
            />
            <IconButton
              icon={<ChevronDownIcon />}
              label={`Move ${category.name} down`}
              size="sm"
              onClick={() => onMoveDown(index)}
              disabled={index === totalCount - 1}
            />
            <IconButton
              icon={<PencilIcon />}
              label={`Edit ${category.name}`}
              size="sm"
              onClick={() => onStartEdit(category)}
            />
            <IconButton
              icon={<TrashIcon />}
              label={`Delete ${category.name}`}
              variant="danger"
              size="sm"
              onClick={() => onDeleteRequest(category.id)}
            />
          </div>
        </div>
      )}
    </GlassCard>
  );
}
