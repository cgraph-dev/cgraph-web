/**
 * KeyboardShortcutsModal - Shows available keyboard shortcuts
 * Triggered by ? or Ctrl+/
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { entranceVariants, springs } from '@/lib/animation-presets';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FADE_IN } from '@/lib/animations/transitions';

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: Shortcut[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open Quick Switcher' },
      { keys: ['Alt', '↑'], description: 'Previous conversation' },
      { keys: ['Alt', '↓'], description: 'Next conversation' },
      { keys: ['Ctrl', 'Shift', 'A'], description: 'Toggle sidebar' },
      { keys: ['Escape'], description: 'Close modal / Go back' },
    ],
  },
  {
    title: 'Messaging',
    shortcuts: [
      { keys: ['Enter'], description: 'Send message' },
      { keys: ['Shift', 'Enter'], description: 'New line' },
      { keys: ['Ctrl', 'Enter'], description: 'Send message (alt)' },
      { keys: ['↑'], description: 'Edit last message' },
      { keys: ['Ctrl', 'Shift', 'E'], description: 'Open emoji picker' },
    ],
  },
  {
    title: 'Calls & Media',
    shortcuts: [
      { keys: ['Ctrl', 'Shift', 'M'], description: 'Toggle mute' },
      { keys: ['Ctrl', 'Shift', 'D'], description: 'Toggle deafen' },
      { keys: ['Ctrl', 'Shift', 'V'], description: 'Toggle video' },
      { keys: ['Ctrl', 'Shift', 'S'], description: 'Share screen' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show this help' },
      { keys: ['Ctrl', '/'], description: 'Show this help (alt)' },
      { keys: ['Ctrl', ','], description: 'Open settings' },
      { keys: ['Ctrl', 'Shift', 'N'], description: 'New conversation' },
    ],
  },
];

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-[28px] items-center justify-center rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-xs font-medium text-[var(--token-text-primary)] shadow-sm">
      {children}
    </kbd>
  );
}

/**
 */
/**
 * Keyboard Shortcuts Modal dialog component.
 */
export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // ? key (not in input/textarea)
      if (
        e.key === '?' &&
        !(
          e.target instanceof HTMLElement &&
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
        )
      ) {
        e.preventDefault();
        setIsOpen((o) => !o);
        return;
      }
      // Ctrl+/ or Cmd+/
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen((o) => !o);
        return;
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          {...FADE_IN}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            variants={entranceVariants.fadeUp}
            initial="initial"
            animate="animate"
            exit="initial"
            transition={springs.gentle}
            onClick={(e) => e.stopPropagation()}
            className="cgraph-dialog-content relative mx-4 w-full max-w-2xl overflow-y-auto p-6"
            data-cgraph-material="floating"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-[var(--token-text-muted)] hover:bg-white/10 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Categories grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {SHORTCUT_CATEGORIES.map((category) => (
                <div key={category.title}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-400">
                    {category.title}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.description}
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5"
                      >
                        <span className="text-sm text-[var(--token-text-secondary)]">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && (
                                <span className="text-xs text-[var(--token-text-muted)]">+</span>
                              )}
                              <KeyBadge>{key}</KeyBadge>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 border-t border-[var(--token-border-muted)] pt-4 text-center text-xs text-[var(--token-text-muted)]">
              Press <KeyBadge>?</KeyBadge> or <KeyBadge>Ctrl</KeyBadge>
              <span className="mx-0.5 text-[var(--token-text-muted)]">+</span>
              <KeyBadge>/</KeyBadge> to toggle this modal
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
