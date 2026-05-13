/**
 * Theme Card Component
 *
 * Visual theme preview card with selection and delete actions.
 */

import { motion, AnimatePresence } from 'motion/react';
import { SparklesIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

import type { ThemeCardProps } from './types';

// COMPONENT

/**
 */
/**
 * Theme Card display component.
 */
export function ThemeCard({ theme, isActive, onSelect, onDelete, isPremium }: ThemeCardProps) {
  const previewColors = {
    bg: theme.colors.background,
    surface: theme.colors.surface,
    primary: theme.colors.primary,
    accent: theme.colors.accent,
    text: theme.colors.textPrimary,
    border: theme.colors.surfaceBorder,
  };

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full rounded-xl border p-1 transition-all duration-300"
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${previewColors.primary}20, ${previewColors.accent}20)`
          : 'rgba(255, 255, 255, 0.7)',
        borderColor: isActive ? previewColors.primary : previewColors.border,
        boxShadow: isActive
          ? `0 18px 40px ${previewColors.primary}22`
          : '0 10px 24px rgba(15, 23, 42, 0.05)',
      }}
    >
      {/* Theme Preview */}
      <div
        className="relative h-24 overflow-hidden rounded-lg"
        style={{ background: previewColors.bg }}
      >
        {/* UI Mock */}
        <div className="relative flex h-full flex-col gap-1 p-2">
          {/* Header */}
          <div className="h-3 rounded" style={{ background: previewColors.surface }} />

          {/* Content */}
          <div className="flex flex-1 gap-1">
            {/* Sidebar */}
            <div className="w-6 rounded" style={{ background: previewColors.surface }} />

            {/* Main content */}
            <div className="flex flex-1 flex-col gap-1">
              {/* Message bubbles */}
              <div
                className="h-2 w-3/4 rounded"
                style={{
                  background: previewColors.primary,
                }}
              />
              <div
                className="h-2 w-1/2 self-end rounded"
                style={{ background: previewColors.surface }}
              />
              <div
                className="h-2 w-2/3 rounded"
                style={{ background: previewColors.primary }}
              ></div>
            </div>
          </div>
        </div>

        {/* Active indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500"
            >
              <CheckIcon className="h-3 w-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium badge */}
        {isPremium && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
            <SparklesIcon className="h-2.5 w-2.5" />
            PRO
          </div>
        )}
      </div>

      {/* Theme info */}
      <div className="mt-2 flex items-center justify-between px-1">
        <div className="text-left">
          <h4 className="truncate text-sm font-medium text-[var(--token-text-primary)]">
            {theme.name}
          </h4>
          <p className="text-xs capitalize text-[var(--token-text-secondary)]">{theme.category}</p>
        </div>

        {/* Delete button for custom themes */}
        {!theme.isBuiltIn && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-[var(--token-text-muted)] transition-colors hover:text-red-500"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.button>
  );
}

export default ThemeCard;
