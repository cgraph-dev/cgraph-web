import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface MemberSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
}

export function MemberSearchBar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}: MemberSearchBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="themed-search-input peer w-full rounded-xl py-2 pl-10 pr-4 text-sm backdrop-blur-xl transition-all duration-200 focus:outline-none"
        />
        <MagnifyingGlassIcon className="themed-search-icon h-4.5 w-4.5 pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-all duration-200" />
      </div>
      <select
        value={roleFilter}
        onChange={(e) => onRoleFilterChange(e.target.value)}
        className="aurora-social-select rounded-xl px-3 py-2 text-sm transition-all focus:outline-none"
      >
        <option value="all">All Roles</option>
        <option value="owner">Owners</option>
        <option value="admin">Admins</option>
        <option value="moderator">Moderators</option>
        <option value="member">Members</option>
      </select>
    </div>
  );
}
