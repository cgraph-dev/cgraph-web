import { motion } from 'motion/react';
import type { Group } from '@/modules/groups/store';
import type { TabId } from './types';
import { SETTINGS_TABS } from './constants';

interface SettingsSidebarProps {
  group: Group;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function SettingsSidebar({ group, activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <div className="w-56 border-r border-[var(--token-border-muted)] bg-[var(--token-sidebar-bg)] p-5 backdrop-blur-2xl backdrop-saturate-[1.8]">
      <div className="mb-6 flex items-center gap-3 border-b border-[var(--token-border-muted)] pb-4">
        <div className="h-10 w-10 overflow-hidden rounded-xl">
          {group.iconUrl ? (
            <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
              <span className="font-bold text-white">{group.name.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-white">{group.name}</h3>
          <p className="text-xs text-gray-400">Group Settings</p>
        </div>
      </div>

      <nav className="space-y-1">
        {SETTINGS_TABS.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange(tab.id)}
            className={`group relative flex w-full items-center gap-3 rounded-xl border transition-all duration-500 ${
              activeTab === tab.id
                ? 'border-[var(--token-card-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.08)] bg-[var(--token-card-bg)/0.4]'
                : tab.id === 'danger'
                  ? 'border-transparent text-red-500 hover:bg-red-500/10'
                  : 'border-transparent hover:bg-[var(--token-bg-primary)/0.3] backdrop-blur-md'
            }`}
            style={
              activeTab === tab.id && tab.id !== 'danger'
                ? { background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-brand-purple) 12%, transparent) 0%, rgba(59,130,246,0.10) 100%)' }
                : {}
            }
          >
            <div className="p-2 relative z-10 flex items-center gap-3 w-full">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-500 ${
                  activeTab === tab.id
                    ? tab.id === 'danger'
                      ? 'border-red-500/30 bg-red-500/10 text-red-400 scale-105'
                      : 'border-primary-500/30 bg-primary-500/10 text-primary-400 scale-105'
                    : 'bg-[var(--token-bg-primary)/0.3] border-[var(--token-border-muted)] text-white/40 group-hover:bg-[var(--token-card-bg)/0.4] group-hover:border-[var(--token-border-muted)]'
                }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? '' : 'group-hover:text-white/80'}`} />
              </div>

              <div className="min-w-0 flex-1 text-left">
                <span className={`text-sm transition-colors ${
                  activeTab === tab.id
                    ? tab.id === 'danger'
                      ? 'font-bold text-red-400'
                      : 'font-bold text-white'
                    : tab.id === 'danger'
                      ? 'text-red-500 group-hover:text-red-400'
                      : 'font-medium text-gray-400 group-hover:text-white'
                }`}>
                  {tab.label}
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </nav>
    </div>
  );
}
