import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface UserSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

export function UserSearchBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: UserSearchBarProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-[var(--token-card-border)] dark:bg-[var(--token-bg-secondary)]">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search users by username or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="themed-search-input peer w-full rounded-xl py-2.5 pl-10 pr-4 text-sm backdrop-blur-xl transition-all duration-200 focus:outline-none"
          />
          <MagnifyingGlassIcon className="themed-search-icon pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 transition-all duration-200" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="aurora-social-select rounded-lg px-4 py-2.5 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>
    </div>
  );
}
