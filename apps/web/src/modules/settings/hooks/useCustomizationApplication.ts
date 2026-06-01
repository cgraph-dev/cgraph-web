/**
 * useCustomizationApplication Hook
 *
 * Applies user customizations to the UI in real-time.
 * Listens to customizationStore and updates CSS variables, body classes,
 * and DOM elements to reflect selected themes and chat styling.
 *
 */

import { useEffect } from 'react';
import { getProfileThemeOrDefault, isProfileThemeId } from '@/data/profileThemes';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';

function resolveProfileThemeCssVariables(themeId: string | null): {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
} | null {
  if (!isProfileThemeId(themeId)) {
    return null;
  }

  const theme = getProfileThemeOrDefault(themeId);
  return {
    primary: theme.accentPrimary,
    secondary: theme.accentSecondary,
    accent: theme.glowColor ?? theme.accentSecondary,
    background: theme.backgroundGradient[0] ?? theme.accentPrimary,
    text: theme.textColor,
  };
}

/**
 * Animation Speed Mappings
 */
const ANIMATION_SPEEDS: Record<string, string> = {
  slow: '1.5',
  normal: '1',
  fast: '0.5',
};

/**
 * Replaces body classes matching a prefix with a new class
 */
function updateBodyClass(prefix: string, newValue: string | null): void {
  document.body.classList.forEach((className) => {
    if (className.startsWith(prefix)) {
      document.body.classList.remove(className);
    }
  });
  if (newValue) {
    document.body.classList.add(`${prefix}${newValue}`);
  }
}

/**
 * Hook to apply user customizations to the UI via CSS variables and body classes.
 * Uses individual Zustand selectors to prevent infinite re-render loops.
 */
export function useCustomizationApplication(): void {
  // Individual selectors ensure stable references (object selectors create new refs each render)
  const profileTheme = useCustomizationStore((s) => s.profileTheme);
  const selectedProfileThemeId = useCustomizationStore((s) => s.selectedProfileThemeId);
  const chatTheme = useCustomizationStore((s) => s.chatTheme);
  const animationSpeed = useCustomizationStore((s) => s.animationSpeed);

  const effectiveProfileTheme = profileTheme ?? selectedProfileThemeId;

  useEffect(() => {
    const root = document.documentElement;

    // Apply profile theme CSS variables
    const colors = resolveProfileThemeCssVariables(effectiveProfileTheme);
    if (colors) {
      root.style.setProperty('--profile-primary', colors.primary);
      root.style.setProperty('--profile-secondary', colors.secondary);
      root.style.setProperty('--profile-accent', colors.accent);
      root.style.setProperty('--profile-background', colors.background);
      root.style.setProperty('--profile-text', colors.text);
    }

    // Apply animation speed multiplier
    const speedMultiplier = ANIMATION_SPEEDS[animationSpeed] ?? '1';
    root.style.setProperty('--animation-speed', speedMultiplier);

    // Apply body classes for themes
    updateBodyClass('particle-effect-', null);
    updateBodyClass('bg-effect-', null);
    updateBodyClass('chat-theme-', chatTheme);
  }, [effectiveProfileTheme, chatTheme, animationSpeed]);
}

/**
 * Get avatar border CSS class and styles
 */
export function getAvatarBorderStyle(borderId: string | null): {
  className: string;
  style?: React.CSSProperties;
} {
  if (!borderId || borderId === 'none') {
    return { className: '' };
  }

  // Map border IDs to CSS classes
  const borderClassMap: Record<string, string> = {
    static: 'avatar-border-static',
    'simple-glow': 'avatar-border-glow',
    'gentle-pulse': 'avatar-border-pulse',
    'rotating-ring': 'avatar-border-rotating',
    'dual-ring': 'avatar-border-dual-ring',
    'rainbow-spin': 'avatar-border-rainbow',
    'electric-arc': 'avatar-border-electric',
    'flame-ring': 'avatar-border-flame',
    'ice-crystal': 'avatar-border-ice',
    'toxic-glow': 'avatar-border-toxic',
    'holy-light': 'avatar-border-holy',
    'shadow-wisp': 'avatar-border-shadow',
    'cosmic-drift': 'avatar-border-cosmic',
  };

  return {
    className: borderClassMap[borderId] || '',
  };
}

/**
 * Get reaction style class
 */
export function getReactionStyleClass(reactionStyle: string): string {
  const reactionClassMap: Record<string, string> = {
    bounce: 'reaction-bounce',
    pop: 'reaction-pop',
    float: 'reaction-float',
    spin: 'reaction-spin',
    pulse: 'reaction-pulse',
    shake: 'reaction-shake',
    zoom: 'reaction-zoom',
  };

  return reactionClassMap[reactionStyle] || 'reaction-bounce';
}
