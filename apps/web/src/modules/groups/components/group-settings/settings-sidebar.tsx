import type { Group } from '@/modules/groups/store';
import { Button } from '@/components/ui/button';
import type { TabId } from './types';
import { SETTINGS_TABS } from './constants';

interface SettingsSidebarProps {
  group: Group;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  tabs?: typeof SETTINGS_TABS;
}

/**
 * Settings Sidebar component.
 */
export function SettingsSidebar({
  group,
  activeTab,
  onTabChange,
  tabs = SETTINGS_TABS,
}: SettingsSidebarProps) {
  return (
    <aside className="cgraph-pane w-full shrink-0 border-b p-3 lg:w-56 lg:border-r lg:border-b-0 lg:p-5">
      <div className="mb-3 flex items-center gap-3 lg:mb-6 lg:border-b lg:border-[var(--token-border-muted)] lg:pb-4">
        <div className="cgraph-empty-icon mb-0 h-10 w-10 shrink-0 overflow-hidden p-0">
          {group.iconUrl ? (
            <img
              src={group.iconUrl}
              alt={group.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-semibold text-[var(--token-text-primary)]">
                {group.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--token-text-primary)]">{group.name}</h3>
          <p className="text-xs text-[var(--token-text-muted)]">Group Settings</p>
        </div>
      </div>

      <nav
        aria-label="Group settings"
        className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0"
      >
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={
              tab.id === 'danger' ? 'danger' : activeTab === tab.id ? 'secondary' : 'ghost'
            }
            size="sm"
            animated={false}
            leftIcon={<tab.icon />}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className="min-h-11 shrink-0 whitespace-nowrap lg:min-h-10 lg:w-full lg:!justify-start"
          >
            {tab.label}
          </Button>
        ))}
      </nav>
    </aside>
  );
}
