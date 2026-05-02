/**
 * CategoryTabs component for theme category selection
 */

import { motion } from 'motion/react';
import {
  ChatBubbleLeftRightIcon,
  NewspaperIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { ALL_PROFILE_THEMES } from '@/data/profileThemes';
import type { ThemeCategory } from './types';

interface CategoryTabItem {
  id: ThemeCategory;
  label: string;
  icon: typeof UserCircleIcon;
  count: number;
}

export const CATEGORIES: CategoryTabItem[] = [
  {
    id: 'profile',
    label: 'Profile Themes',
    icon: UserCircleIcon,
    count: ALL_PROFILE_THEMES.length,
  },
  { id: 'chat', label: 'Chat Themes', icon: ChatBubbleLeftRightIcon, count: 5 },
  { id: 'forum', label: 'Forum Themes', icon: NewspaperIcon, count: 4 },
  { id: 'app', label: 'App Themes', icon: Squares2X2Icon, count: 4 },
];

interface CategoryTabsProps {
  activeCategory: ThemeCategory;
  onCategoryChange: (category: ThemeCategory) => void;
}

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 rounded-2xl border border-white/8 bg-slate-950/35 p-2 backdrop-blur-xl">
      {CATEGORIES.map((category) => {
        const Icon = category.icon;
        return (
          <motion.button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`group relative flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all duration-300 ${
              activeCategory === category.id
                ? 'border-primary-400/30 bg-gradient-to-r from-primary-500/70 via-violet-500/60 to-primary-400/45 ring-0 shadow-[0_12px_30px_rgba(76,29,149,0.35)]'
                : 'border-white/6 bg-white/[0.025] hover:border-white/12 hover:bg-white/[0.05] backdrop-blur-md'
            }`}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-500 ${
                activeCategory === category.id
                  ? 'border-white/15 bg-white/10 text-white scale-105'
                  : 'bg-white/5 border-white/8 text-white/45 group-hover:bg-white/8 group-hover:border-white/12'
              }`}
            >
              <Icon className={`h-4 w-4 ${activeCategory === category.id ? '' : 'group-hover:text-[var(--token-text-secondary)]'}`} />
            </div>
            <span className={`text-sm font-bold transition-colors ${
              activeCategory === category.id
                ? 'text-white'
                : 'text-white/65 group-hover:text-white/85'
            }`}>
              {category.label}
            </span>
            <span className={`flex h-6 min-w-[24px] items-center justify-center rounded-md px-1.5 text-[10px] font-bold transition-all duration-500 ${
              activeCategory === category.id
                ? 'border border-white/15 bg-white/10 text-white'
                : 'bg-white/6 text-white/50 group-hover:bg-white/10 group-hover:text-white/75'
            }`}>
              {category.count}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
