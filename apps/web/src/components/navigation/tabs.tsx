/**
 * Tab navigation component.
 */
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

/**
 * Tabs component.
 */
export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
}: TabsProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const getTabClasses = (isActive: boolean) => {
    const base = `${sizeClasses[size]} font-medium transition-all flex items-center gap-2`;

    switch (variant) {
      case 'pills':
        return `${base} rounded-full transform active:scale-95 ${
          isActive
            ? 'bg-blue-500/80 text-white shadow-[0_0_12px_rgba(59,130,246,0.2)]'
            : 'text-gray-400 hover:text-white hover:bg-[var(--token-card-bg)]'
        }`;
      case 'underline':
        return `${base} border-b-2 transform active:scale-95 ${
          isActive
            ? 'border-blue-400 text-white'
            : 'border-transparent text-gray-400 hover:text-white hover:border-[var(--token-card-border)]'
        }`;
      default:
        return `${base} rounded-xl transform active:scale-95 ${
          isActive
            ? 'bg-[var(--token-card-bg)] text-white shadow-[inset_0_0.5px_0_rgba(255,255,255,0.06)]'
            : 'text-gray-400 hover:text-white hover:bg-[var(--token-bg-secondary)]'
        }`;
    }
  };

  return (
    <div
      className={`flex ${variant === 'underline' ? 'border-b border-[var(--token-card-border)]' : 'gap-1 rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-1 backdrop-blur-[12px]'} ${
        fullWidth ? 'w-full' : 'inline-flex'
      } ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`${getTabClasses(activeTab === tab.id)} ${fullWidth ? 'flex-1' : ''}`}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
