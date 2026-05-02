/**
 * ThreadStatusFilters – checkbox group for thread status & attachment filters
 */
import {
  CHECKBOX_CLS,
  THREAD_STATUS_OPTIONS,
} from '@/modules/search/components/advanced-search/constants';
import type { AdvancedSearchFilters } from '@/modules/search/components/advanced-search/types';

type ThreadStatusKey = (typeof THREAD_STATUS_OPTIONS)[number]['key'];
type RequiredThreadStatusKey = 'showClosed' | 'showSticky' | 'showNormal';

function isRequiredThreadStatusKey(key: ThreadStatusKey): key is RequiredThreadStatusKey {
  return key === 'showClosed' || key === 'showSticky' || key === 'showNormal';
}

interface ThreadStatusFiltersProps {
  filters: AdvancedSearchFilters;
  updateFilter: <K extends keyof AdvancedSearchFilters>(
    key: K,
    value: AdvancedSearchFilters[K]
  ) => void;
}

export function ThreadStatusFilters({ filters, updateFilter }: ThreadStatusFiltersProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-400">Thread Status</label>
      <div className="flex flex-wrap gap-6">
        {THREAD_STATUS_OPTIONS.map(({ key, label, boolean: plain }) => (
          <label key={key} className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"

              checked={filters[key] === true}
              onChange={(e) => {
                if (plain && isRequiredThreadStatusKey(key)) {
                  updateFilter(key, e.target.checked);
                  return;
                }

                if (!isRequiredThreadStatusKey(key)) {
                  updateFilter(key, e.target.checked || undefined);
                }
              }}
              className={CHECKBOX_CLS}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
