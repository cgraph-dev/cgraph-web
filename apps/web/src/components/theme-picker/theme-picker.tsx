/**
 * ThemePicker — Renders preview cards for each theme with auto-detect toggle.
 *
 * Supports 3 placements:
 * - 'settings': full-width grid, embedded in settings pages
 * - 'floating': compact popover panel
 * - 'modal': standalone modal triggered by keyboard shortcut
 */
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useThemeEnhanced } from '@/providers/theme-enhanced/hooks';
import { getTokensForTheme } from '@/lib/theme/tokens';
import { ThemePreviewCard } from './theme-preview-card';
import { THEME_ORDER, THEME_CYCLE } from './constants';
import { transitionTheme } from './theme-transition';

interface ThemePickerProps {
  placement?: 'settings' | 'floating' | 'modal';
}

/** Theme Picker. */
export function ThemePicker({ placement = 'settings' }: ThemePickerProps): React.ReactElement {
  const {
    theme: activeTheme,
    setTheme,
    preferences,
    isSystemPreference,
    toggleSystemPreference,
  } = useThemeEnhanced();

  const { reduceMotion } = preferences.settings;
  const isAutoMode = isSystemPreference;

  function handleSelect(themeId: string) {
    transitionTheme(() => setTheme(themeId), reduceMotion);
  }

  // Keyboard shortcut: Ctrl+Shift+T (or Cmd+Shift+T) cycles themes
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        const currentIndex = THEME_CYCLE.findIndex((id) => id === activeTheme.id);
        const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
        const nextThemeId = THEME_CYCLE[nextIndex]!;
        transitionTheme(() => setTheme(nextThemeId), reduceMotion);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTheme.id, setTheme, isAutoMode, toggleSystemPreference, reduceMotion]);

  const isCompact = placement === 'floating';

  return (
    <div className={isCompact ? 'p-3' : 'w-full'}>
      {!isCompact && (
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--token-text-secondary)]">
          Choose Your Theme
        </h2>
      )}

      <div className={isCompact ? 'flex gap-2' : 'grid grid-cols-3 gap-4'}>
        {THEME_ORDER.map((themeId) => (
          <ThemePreviewCard
            key={themeId}
            themeId={themeId}
            tokens={getTokensForTheme(themeId)}
            isActive={activeTheme.id === themeId}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Auto (system preference) toggle */}
      <label className="mt-4 flex cursor-pointer select-none items-center gap-2">
        <input
          type="checkbox"
          checked={isAutoMode}
          onChange={toggleSystemPreference}
          className="peer sr-only"
        />
        <motion.div
          aria-hidden="true"
          className="relative h-[18px] w-8 overflow-hidden rounded-full border"
          animate={{
            backgroundColor: isAutoMode
              ? 'color-mix(in srgb, var(--token-interactive-primary) 82%, white 8%)'
              : 'var(--token-input-bg)',
            borderColor: isAutoMode
              ? 'color-mix(in srgb, var(--token-interactive-primary) 58%, transparent)'
              : 'var(--token-input-border)',
            boxShadow: isAutoMode
              ? '0 0 0 1px color-mix(in srgb, var(--token-interactive-primary) 24%, transparent), 0 6px 18px color-mix(in srgb, var(--token-interactive-primary) 18%, transparent)'
              : 'inset 0 1px 2px rgba(0, 0, 0, 0.12)',
          }}
          transition={
            reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 22 }
          }
        >
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{
              opacity: isAutoMode ? 1 : 0,
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--token-interactive-primary) 42%, white 8%) 0%, color-mix(in srgb, var(--token-interactive-primary) 70%, transparent) 100%)',
            }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.22 }}
          />
          <motion.div
            className="absolute top-0.5 h-3 w-3 rounded-full bg-white"
            animate={{
              left: isAutoMode ? 18 : 2,
              scale: isAutoMode ? 1.02 : 1,
              boxShadow: isAutoMode
                ? '0 2px 10px rgba(255,255,255,0.42), 0 0 0 1px rgba(255,255,255,0.3)'
                : '0 2px 8px rgba(0,0,0,0.2)',
            }}
            transition={
              reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 24 }
            }
          />
        </motion.div>
        <span className="text-sm text-[var(--token-text-secondary)]">
          Auto (match system preference)
        </span>
        <kbd className="ml-auto rounded border border-[var(--token-border-default)] bg-[var(--token-bg-tertiary)] px-1.5 py-0.5 text-xs text-[var(--token-text-muted)]">
          {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Shift+T
        </kbd>
      </label>
    </div>
  );
}
