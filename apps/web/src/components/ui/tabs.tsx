import { ReactNode, createContext, use, useState } from 'react';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  readonly children: ReactNode;
  readonly value?: string;
  readonly onValueChange?: (value: string) => void;
  readonly defaultValue?: string;
  readonly className?: string;
}
/** Tabs. */
export function Tabs({
  children,
  value: controlledValue,
  onValueChange,
  defaultValue = '',
  className = '',
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const value = controlledValue ?? internalValue;
  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  readonly children: ReactNode;
  readonly className?: string;
}
/** Tabs List. */
export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-xl border border-[var(--token-border-default)] bg-[var(--token-bg-secondary)] p-1 backdrop-blur-[12px] ${className} `}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  readonly children: ReactNode;
  readonly value: string;
  readonly className?: string;
  readonly disabled?: boolean;
}
/** Tabs Trigger. */
export function TabsTrigger({
  children,
  value,
  className = '',
  disabled = false,
}: TabsTriggerProps) {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');

  const isSelected = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => ctx.onValueChange(value)}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        isSelected
          ? 'bg-[var(--token-card-bg)] text-[var(--token-text-primary)] shadow-[inset_0_0.5px_0_rgba(255,255,255,0.06)] backdrop-blur-sm'
          : 'text-[var(--token-text-secondary)] hover:bg-[var(--token-card-bg)] hover:text-[var(--token-text-primary)]'
      } ${className} `}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  readonly children: ReactNode;
  readonly value: string;
  readonly className?: string;
}
/** Tabs Content. */
export function TabsContent({ children, value, className = '' }: TabsContentProps) {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used within Tabs');

  if (ctx.value !== value) return null;

  return (
    <div role="tabpanel" className={`mt-4 ${className}`}>
      {children}
    </div>
  );
}

export default Tabs;
