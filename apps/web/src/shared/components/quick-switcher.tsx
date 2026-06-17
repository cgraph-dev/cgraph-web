/**
 * QuickSwitcher - Cmd+K / Ctrl+K command palette for fast navigation
 *
 * Search across: conversations, groups, channels, friends, settings pages
 * Keyboard: Arrow up/down to select, Enter to navigate, Escape to close
 * Shows recent items by default.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { springPreset, glassSurfaceElevated } from '@/components/liquid-glass/shared';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  HashtagIcon,
  UserIcon,
  Cog6ToothIcon,
  NewspaperIcon,
  PlusCircleIcon,
  GlobeAltIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { FADE_IN } from '@/lib/animations/transitions';

interface QuickSwitcherItem {
  id: string;
  type: 'conversation' | 'group' | 'channel' | 'friend' | 'settings' | 'forum' | 'action';
  name: string;
  subtitle?: string;
  icon: React.ElementType;
  path: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  conversation: ChatBubbleLeftRightIcon,
  group: UserGroupIcon,
  channel: HashtagIcon,
  friend: UserIcon,
  settings: Cog6ToothIcon,
  forum: NewspaperIcon,
  action: PlusCircleIcon,
};

const SETTINGS_PAGES: QuickSwitcherItem[] = [
  {
    id: 'settings-account',
    type: 'settings',
    name: 'Account Settings',
    path: '/me/settings/account',
    icon: Cog6ToothIcon,
  },
  {
    id: 'settings-appearance',
    type: 'settings',
    name: 'Appearance',
    path: '/me/settings/appearance',
    icon: Cog6ToothIcon,
  },
  {
    id: 'settings-notifications',
    type: 'settings',
    name: 'Notifications',
    path: '/me/settings/notifications',
    icon: Cog6ToothIcon,
  },
  {
    id: 'settings-privacy',
    type: 'settings',
    name: 'Privacy & Security',
    path: '/me/settings/privacy',
    icon: Cog6ToothIcon,
  },
  {
    id: 'settings-customization',
    type: 'settings',
    name: 'Customization',
    path: '/me/appearance/identity',
    icon: Cog6ToothIcon,
  },
];

const QUICK_ACTIONS: QuickSwitcherItem[] = [
  {
    id: 'action-new-dm',
    type: 'action',
    name: 'New Message',
    subtitle: 'Start a conversation',
    path: '/messages?new=true',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    id: 'action-new-group',
    type: 'action',
    name: 'Create Group',
    subtitle: 'Start a new group',
    path: '/groups?create=true',
    icon: UserGroupIcon,
  },
  {
    id: 'action-spaces',
    type: 'action',
    name: 'Open Spaces',
    subtitle: 'Organize conversations',
    path: '/spaces',
    icon: FolderIcon,
  },
  {
    id: 'action-explore',
    type: 'action',
    name: 'Explore Communities',
    subtitle: 'Discover groups & forums',
    path: '/explore',
    icon: GlobeAltIcon,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  conversation: 'Conversations',
  channel: 'Channels',
  group: 'Groups',
  forum: 'Forums',
  friend: 'Friends',
  action: 'Actions',
  settings: 'Settings',
};

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  items?: QuickSwitcherItem[];
}

/**
 */
/**
 * Quick Switcher component.
 */
export function QuickSwitcher({ isOpen, onClose, items = [] }: QuickSwitcherProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const allItems = useMemo(() => [...items, ...SETTINGS_PAGES, ...QUICK_ACTIONS], [items]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show recent items (first 8)
      return allItems.slice(0, 8);
    }
    const q = query.toLowerCase();
    return allItems
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.subtitle?.toLowerCase().includes(q) ||
          item.type.includes(q)
      )
      .slice(0, 12);
  }, [query, allItems]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // Scroll selected item into view
  useEffect(() => {
    const child = listRef.current?.children[selectedIndex];
    if (child instanceof HTMLElement && typeof child.scrollIntoView === 'function') {
      child.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  function handleSelect(item: QuickSwitcherItem) {
    navigate(item.path);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }

  // Global Cmd+K / Ctrl+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        {...FADE_IN}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[20vh] backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={springPreset}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-lg overflow-hidden rounded-xl ${glassSurfaceElevated}`}
        >
          {/* Search input */}
          <div className="border-b border-[var(--token-card-border)] px-4 py-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Where would you like to go?"
                className="focus:border-primary-500/40 focus:ring-primary-500/10 peer w-full rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] py-3 pl-11 pr-14 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-[var(--token-text-muted)] focus:bg-[var(--token-card-bg)] focus:outline-none focus:ring-4"
              />
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--token-text-muted)] transition-all duration-200 peer-focus:text-primary-400" />
              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <kbd className="rounded border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-1.5 py-0.5 text-[10px] text-gray-500">
                  ESC
                </kbd>
              </div>
            </div>
          </div>

          {/* Results with category headers */}
          <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              (() => {
                let lastCategory = '';
                let flatIndex = -1;
                return filtered.map((item) => {
                  flatIndex++;
                  const currentFlatIndex = flatIndex;
                  const Icon = item.icon || ICON_MAP[item.type] || Cog6ToothIcon;
                  const isSelected = currentFlatIndex === selectedIndex;
                  const showHeader = item.type !== lastCategory;
                  lastCategory = item.type;

                  return (
                    <React.Fragment key={item.id}>
                      {showHeader && (
                        <div className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          {CATEGORY_LABELS[item.type] || item.type}
                        </div>
                      )}
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: currentFlatIndex * 0.03, ...springPreset }}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? 'bg-[var(--token-card-bg)] text-white'
                            : 'text-gray-300 hover:bg-[var(--token-card-bg)]'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 shrink-0 ${isSelected ? 'text-primary-400' : 'text-gray-500'}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {highlightMatch(item.name, query)}
                          </div>
                          {item.subtitle && (
                            <div className="truncate text-xs text-gray-500">{item.subtitle}</div>
                          )}
                        </div>
                        <span className="shrink-0 rounded border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-1.5 py-0.5 text-[10px] uppercase text-gray-500">
                          {item.type}
                        </span>
                      </motion.button>
                    </React.Fragment>
                  );
                });
              })()
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 border-t border-[var(--token-card-border)] px-4 py-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-1.5 py-0.5">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-1.5 py-0.5">
                ↵
              </kbd>{' '}
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[var(--token-card-border)] bg-[var(--token-card-bg)] px-1.5 py-0.5">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <span className="text-primary-400">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  );
}
