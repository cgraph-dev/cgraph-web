/**
 * ForumThemeProvider component
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { SafeStyle } from '@/shared/components/security/safe-html';
import type { ForumThemeProviderProps } from './types';
import { RADIUS_MAP, SHADOW_MAP, FONT_SIZE_MAP } from './constants';

type ForumCssVariables = React.CSSProperties & Record<`--forum-${string}`, string>;

function mapCssValue(map: Record<string, string>, key: string, fallback: string): string {
  return map[key] ?? fallback;
}

export const ForumThemeProvider = memo(function ForumThemeProvider({
  theme,
  children,
  className,
}: ForumThemeProviderProps) {
  const cssVariables = (): ForumCssVariables => {
    const { colors, borderRadius, borderWidth, shadows, fontFamily, headerFontFamily, fontSize } =
      theme;
    return {
      '--forum-primary': colors.primary,
      '--forum-secondary': colors.secondary,
      '--forum-accent': colors.accent,
      '--forum-background': colors.background,
      '--forum-surface': colors.surface,
      '--forum-elevated': colors.elevated,
      '--forum-text-primary': colors.textPrimary,
      '--forum-text-secondary': colors.textSecondary,
      '--forum-text-muted': colors.textMuted,
      '--forum-border': colors.border,
      '--forum-divider': colors.divider,
      '--forum-success': colors.success,
      '--forum-warning': colors.warning,
      '--forum-error': colors.error,
      '--forum-info': colors.info,
      '--forum-member-color': colors.memberColor,
      '--forum-mod-color': colors.modColor,
      '--forum-admin-color': colors.adminColor,
      '--forum-owner-color': colors.ownerColor,
      '--forum-radius': mapCssValue(RADIUS_MAP, borderRadius, '0.5rem'),
      '--forum-border-width': `${borderWidth}px`,
      '--forum-shadow': mapCssValue(SHADOW_MAP, shadows, '0 1px 3px rgba(0,0,0,0.1)'),
      '--forum-font-family': fontFamily,
      '--forum-header-font-family': headerFontFamily,
      '--forum-font-size': mapCssValue(FONT_SIZE_MAP, fontSize, '1rem'),
      backgroundColor: colors.background,
      color: colors.textPrimary,
      fontFamily: fontFamily,
    };
  };

  return (
    <div className={cn('forum-theme-container min-h-screen', className)} style={cssVariables()}>
      {/* Inject custom CSS - sanitized to prevent CSS injection attacks */}
      {theme.customCss && <SafeStyle css={theme.customCss} />}

      {/* Glassmorphism backdrop */}
      {theme.glassmorphism && (
        <style>{`
          .forum-theme-container .glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        `}</style>
      )}

      {children}
    </div>
  );
});

export default ForumThemeProvider;
