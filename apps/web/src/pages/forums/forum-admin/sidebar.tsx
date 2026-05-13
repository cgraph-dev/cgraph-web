/**
 * Sidebar component for Forum Admin Dashboard
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { TABS } from './constants';
import type { AdminTab, ForumAppearance, ModQueueItem } from './types';

interface SidebarProps {
  forumSlug: string;
  forumName: string;
  appearance: ForumAppearance;
  activeTab: AdminTab;
  modQueue: ModQueueItem[];
  isSaving: boolean;
  onTabChange: (tab: AdminTab) => void;
  onSave: () => void;
}

/**
 */
/**
 * Sidebar component.
 */
export function Sidebar({
  forumSlug,
  forumName,
  appearance,
  activeTab,
  modQueue,
  isSaving,
  onTabChange,
  onSave,
}: SidebarProps) {
  const pendingCount = modQueue.filter((i) => i.status === 'pending').length;

  return (
    <aside className="relative z-10 flex h-full w-64 shrink-0 flex-col border-r border-[var(--token-card-border)] bg-[var(--token-card-bg)]/40 backdrop-blur-3xl transition-all duration-300">
      {/* Header */}
      <div className="border-b border-[var(--token-card-border)] p-4">
        <Link
          to={`/forums/${forumSlug}`}
          className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-sm">Back to Forum</span>
        </Link>
        <div className="flex items-center gap-3">
          {appearance.iconUrl ? (
            <img src={appearance.iconUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-purple-600">
              <span className="text-lg font-bold text-white">{forumName[0]}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-bold text-white">{forumName}</h1>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {TABS.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => {
              onTabChange(tab.id);
              HapticFeedback.light();
            }}
            className={`group relative flex w-full items-center gap-3 rounded-xl border transition-all duration-500 ${
              activeTab === tab.id
                ? 'border-[var(--token-card-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.08)]'
                : 'border-transparent bg-transparent hover:bg-[var(--token-bg-primary)] backdrop-blur-md'
            }`}
            style={
              activeTab === tab.id
                ? { background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-brand-purple) 12%, transparent) 0%, rgba(59,130,246,0.10) 100%)' }
                : {}
            }
            whileTap={{ scale: 0.98 }}
          >
            <div className="p-3 relative z-10 flex items-center gap-3 w-full">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-500 ${
                  activeTab === tab.id
                    ? 'border-primary-500/30 bg-primary-500/10 text-primary-400 scale-105'
                    : 'bg-[var(--token-bg-primary)] border-[var(--token-border-muted)] text-white/40 group-hover:bg-[var(--token-bg-secondary)] group-hover:border-[var(--token-border-muted)]'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? '' : 'group-hover:text-white/80'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-bold transition-colors ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{tab.name}</div>
                <div className="truncate text-[11px] font-medium opacity-60 transition-colors group-hover:text-white/60">{tab.description}</div>
              </div>
              {tab.id === 'modqueue' && pendingCount > 0 && (
                <span className="relative z-10 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                  {pendingCount}
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </nav>

      {/* Save Button */}
      <div className="border-t border-[var(--token-card-border)] p-4">
        <motion.button
          onClick={onSave}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-primary-600/50"
          whileTap={{ scale: 0.98 }}
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              Save Changes
            </>
          )}
        </motion.button>
      </div>
    </aside>
  );
}
