import type { OptionSelectProps } from './types';
// COMPONENT
/**
 * Generic select dropdown with typed value
 */
function OptionSelectInner<T extends string>({
  label,
  value,
  onChange,
  options,
}: OptionSelectProps<T>) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <select
        value={value}
        onChange={(e) => {
          const nextValue = options.find((option) => option.value === e.target.value)?.value;
          if (nextValue) {
            onChange(nextValue);
          }
        }}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-[var(--token-card-border)] dark:bg-[var(--token-card-bg)] dark:text-gray-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export const OptionSelect = OptionSelectInner;

export default OptionSelectInner;
