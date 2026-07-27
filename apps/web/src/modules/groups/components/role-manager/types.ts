import type { Role } from '@/modules/groups/store';

/**
 * Permission definition
 */
export interface PermissionDef {
  value: number;
  label: string;
  description: string;
  danger?: boolean;
}

/**
 * RoleManager component props
 */
export interface RoleManagerProps {
  groupId: string;
  className?: string;
}

/**
 * RoleEditor component props
 */
export interface RoleEditorProps {
  role: Role;
  isNew: boolean;
  isSaving?: boolean;
  nameError?: string | null;
  onUpdate: (updates: Partial<Role>) => void;
  onDelete: () => void;
  onSave: () => void;
}

/**
 * RoleListItem component props
 */
export interface RoleListItemProps {
  role: Role;
  isSelected: boolean;
  onSelect: () => void;
}
