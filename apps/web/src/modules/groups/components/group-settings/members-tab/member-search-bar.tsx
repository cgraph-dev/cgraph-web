import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Input, Select } from '@/components/ui/input';
import type { GroupRole } from './types';

interface MemberSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  roles: readonly GroupRole[];
}

export function MemberSearchBar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  roles,
}: MemberSearchBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        aria-label="Search members"
        type="search"
        placeholder="Search members..."
        value={search}
        leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
        onChange={(event) => onSearchChange(event.target.value)}
        className="min-h-11"
      />
      <Select
        aria-label="Filter members by role"
        value={roleFilter}
        onChange={(event) => onRoleFilterChange(event.target.value)}
        fullWidth={false}
        className="min-h-11 min-w-44"
        options={[
          { value: 'all', label: 'All roles' },
          ...roles.map((role) => ({ value: role.name, label: role.name })),
        ]}
      />
    </div>
  );
}
