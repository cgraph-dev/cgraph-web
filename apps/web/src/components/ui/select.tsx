import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { glassSurfaceElevated } from '@/components/liquid-glass/shared';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface SelectProps {
  readonly options: Option[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly label?: string;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly searchable?: boolean;
  readonly className?: string;
}
function getBorderClass(hasError: boolean, isOpen: boolean): string {
  if (hasError) return 'border-red-500';
  if (isOpen) return 'border-[var(--token-card-border)]';
  return 'border-[var(--token-card-border)]';
}

/** Select. */
export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  disabled = false,
  searchable = false,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && <label className="mb-2 block text-sm font-medium text-white/70">{label}</label>}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`aurora-social-select flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm backdrop-blur-2xl transition-all duration-300 ${getBorderClass(!!error, isOpen)} ${
          isOpen ? 'ring-primary-500/20 ring-2' : ''
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-primary-400/20'}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {selectedOption?.icon}
          <span className={selectedOption ? 'truncate text-white' : 'text-white/35'}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 text-white/45 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className={`aurora-social-panel absolute z-20 mt-2 max-h-60 w-full overflow-hidden rounded-xl ${glassSurfaceElevated} shadow-xl`}
        >
          {searchable && (
            <div className="border-b border-[var(--token-card-border)] p-2">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="aurora-social-select w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-white/40">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  data-active={option.value === value}
                  className={`aurora-social-option flex w-full items-center justify-between px-4 py-2.5 transition-colors ${
                    option.value === value ? 'text-white' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {option.icon}
                    <div className="min-w-0">
                      <span className="block truncate text-sm text-white">{option.label}</span>
                      {option.description && (
                        <span className="block truncate text-xs text-white/40">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {option.value === value && <CheckIcon className="h-4 w-4 text-primary-300" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

/** Composable Select. */
function ComposableSelect({
  children,
  value: _value,
  onValueChange: _onValueChange,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return <div className="relative">{children}</div>;
}

export { ComposableSelect as Select };

/** Select Trigger. */
export function SelectTrigger({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      className={`inline-flex items-center justify-between rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-white ${className}`}
    >
      {children}
    </button>
  );
}

/** Select Value. */
export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder || ''}</span>;
}

/** Select Content. */
export function SelectContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-1 shadow-xl">
      {children}
    </div>
  );
}

/** Select Item. */
export function SelectItem({
  children,
  value: _value,
}: {
  children: React.ReactNode;
  value: string;
}) {
  return (
    <div className="cursor-pointer rounded px-3 py-2 text-sm text-white hover:bg-[var(--token-card-bg)]">
      {children}
    </div>
  );
}
