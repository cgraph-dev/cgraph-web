/**
 * ThemePreviewCard — Mini mockup card showing a theme preview.
 *
 * Renders a miniature app mockup (sidebar + messages + input) using the
 * theme's SemanticTokens, regardless of the current active theme.
 */
import { type CSSProperties } from 'react';
import { motion } from 'motion/react';
import type { SemanticTokens } from '@/lib/theme/tokens';
import { THEME_METADATA } from './constants';

type CSSPropertiesWithVars = CSSProperties & Record<`--${string}`, string>;

interface ThemePreviewCardProps {
  themeId: string;
  tokens: SemanticTokens;
  isActive: boolean;
  onSelect: (themeId: string) => void;
}

/** Theme Preview Card. */
export function ThemePreviewCard({
  themeId,
  tokens,
  isActive,
  onSelect,
}: ThemePreviewCardProps): React.ReactElement {
  const meta = THEME_METADATA[themeId] ?? { name: themeId, icon: '🎨', description: '' };

  const style: CSSPropertiesWithVars = {
    '--preview-bg': tokens['bg-primary'],
    '--preview-bg2': tokens['bg-secondary'],
    '--preview-sidebar': tokens['sidebar-bg'],
    '--preview-sidebar-text': tokens['sidebar-text'],
    '--preview-sidebar-active': tokens['sidebar-active'],
    '--preview-text': tokens['text-primary'],
    '--preview-text2': tokens['text-secondary'],
    '--preview-text-muted': tokens['text-muted'],
    '--preview-bubble-sent': tokens['chat-bubble-sent'],
    '--preview-bubble-recv': tokens['chat-bubble-received'],
    '--preview-input': tokens['input-bg'],
    '--preview-input-border': tokens['input-border'],
    '--preview-accent': tokens['interactive-primary'],
    '--preview-border': tokens['border-default'],
    '--preview-card-bg': tokens['card-bg'],
  };

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(themeId)}
      className="group relative flex flex-col overflow-hidden rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--token-interactive-primary)]"
      style={style}
      whileHover={{ opacity: 0.9 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      aria-pressed={isActive}
      aria-label={`Select ${meta.name} theme`}
    >
      {/* Active indicator ring */}
      {isActive && (
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-xl"
          style={{
            boxShadow: `inset 0 0 0 2px ${tokens['interactive-primary']}, 0 0 16px ${tokens['interactive-primary']}40`,
          }}
        />
      )}

      {/* Mini app mockup */}
      <div
        className="relative flex aspect-[4/3] w-full overflow-hidden rounded-t-xl"
        style={{ background: 'var(--preview-bg)' }}
      >
        {/* Mini sidebar */}
        <div
          className="flex w-[28%] shrink-0 flex-col gap-1 p-1.5"
          style={{ background: 'var(--preview-sidebar)' }}
        >
          <div
            className="h-2 w-3/4 rounded-full"
            style={{ background: 'var(--preview-sidebar-active)' }}
          />
          <div
            className="h-1.5 w-1/2 rounded-full opacity-50"
            style={{ background: 'var(--preview-sidebar-text)' }}
          />
          <div
            className="h-1.5 w-2/3 rounded-full opacity-40"
            style={{ background: 'var(--preview-sidebar-text)' }}
          />
        </div>

        {/* Mini message area */}
        <div className="flex flex-1 flex-col justify-between gap-1 p-1.5">
          {/* Messages */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: 'var(--preview-accent)', opacity: 0.5 }}
              />
              <div className="flex flex-col gap-0.5">
                <div
                  className="h-1 w-6 rounded"
                  style={{ background: 'var(--preview-text-muted)' }}
                />
                <div
                  className="flex h-4 items-center rounded-lg px-1"
                  style={{ background: 'var(--preview-bubble-recv)' }}
                >
                  <div
                    className="h-1 w-10 rounded"
                    style={{ background: 'var(--preview-text2)' }}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-1">
              <div
                className="flex h-4 items-center rounded-lg px-1"
                style={{ background: 'var(--preview-bubble-sent)' }}
              >
                <div
                  className="h-1 w-8 rounded"
                  style={{ background: 'var(--preview-text)', opacity: 0.9 }}
                />
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div
            className="h-3 rounded-md"
            style={{
              background: 'var(--preview-input)',
              border: '1px solid var(--preview-input-border)',
            }}
          />
        </div>
      </div>

      {/* Label area */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ background: 'var(--preview-bg2)', borderTop: '1px solid var(--preview-border)' }}
      >
        <span className="text-base" role="img" aria-hidden="true">
          {meta.icon}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold" style={{ color: 'var(--preview-text)' }}>
            {meta.name}
          </span>
          <span className="truncate text-xs" style={{ color: 'var(--preview-text-muted)' }}>
            {meta.description}
          </span>
        </div>
        {isActive && (
          <div className="ml-auto shrink-0">
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: tokens['interactive-primary'] }}
            >
              <circle cx="8" cy="8" r="8" fill="currentColor" />
              <path
                d="M5 8l2 2 4-4"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </motion.button>
  );
}
