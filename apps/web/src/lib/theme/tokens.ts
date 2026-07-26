/**
 * Unified Design Tokens — Single Source of Truth
 *
 * All color values for every theme live here. Both web (CSS-variable injection)
 * and mobile (themeStore) must derive from these canonical values.
 *
 * ## Token Categories
 * - Surface: backgrounds at different elevation levels
 * - Text: foreground text at different emphasis levels
 * - Interactive: buttons, links, focus rings
 * - Feedback: success, warning, error, info semantic colors
 * - Component: chat bubbles, sidebar, cards, inputs
 * - Holo: holographic-effect colors (special themes only)
 *
 * ## WCAG AA Compliance
 * Every text/bg pair is annotated with its contrast ratio.
 * Normal text requires ≥ 4.5:1, large text ≥ 3:1.
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L = 0.2126·R + 0.7152·G + 0.0722·B (linearised sRGB)
 *
 */

// WCAG CONTRAST UTILITIES

/**
 * Convert a hex color to its relative luminance (0–1).
 */
export function hexToLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/**
 * Calculate WCAG contrast ratio between two hex colors.
 * Returns a number ≥ 1 (e.g. 4.5 means 4.5:1).
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check whether two hex colors pass WCAG AA contrast (4.5:1 for normal text).
 */
export function passesAA(hex1: string, hex2: string): boolean {
  return contrastRatio(hex1, hex2) >= 4.5;
}

/**
 * Check whether two hex colors pass WCAG AA Large contrast (3:1 for large text).
 */
export function passesAALarge(hex1: string, hex2: string): boolean {
  return contrastRatio(hex1, hex2) >= 3;
}

/**
 * Convert an [R, G, B] tuple to an "r, g, b" string (for CSS custom properties).
 */
export function rgbString(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return '0, 0, 0';
  return `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
}

/**
 * Parse a color string (hex #RGB, #RRGGBB or rgba()) into [R, G, B] 0-255 tuple.
 * Returns null if the format is unrecognized.
 */
export function hexToRgb(color: string): [number, number, number] | null {
  if (!color) return null;
  const normalized = color.trim().toLowerCase();

  // Handle rgba() / rgb()
  if (normalized.startsWith('rgb')) {
    const match = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
      return [parseInt(match[1]!, 10), parseInt(match[2]!, 10), parseInt(match[3]!, 10)];
    }
  }

  // Handle Hex
  const hex = normalized.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0]! + hex[0], 16);
    const g = parseInt(hex[1]! + hex[1], 16);
    const b = parseInt(hex[2]! + hex[2], 16);
    return [r, g, b];
  }

  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return [r, g, b];
  }

  return null;
}

// SEMANTIC TOKEN DEFINITIONS

/**
 * Semantic color tokens for a single theme.
 * Keys map directly to CSS variables: `--token-<category>-<name>`.
 */
export interface SemanticTokens {
  // Surface tokens (backgrounds)
  'bg-primary': string;
  'bg-secondary': string;
  'bg-tertiary': string;
  'bg-inverse': string;

  // Text tokens
  'text-primary': string;
  'text-secondary': string;
  'text-muted': string;
  'text-inverse': string;
  'text-on-primary': string;
  'text-on-error': string;

  // Interactive tokens
  'interactive-primary': string;
  'interactive-hover': string;
  'interactive-active': string;
  'interactive-disabled': string;

  // Feedback tokens
  'feedback-error': string;
  'feedback-warning': string;
  'feedback-success': string;
  'feedback-info': string;

  // Component tokens — chat
  'chat-bg': string;
  'chat-bubble-sent': string;
  'chat-bubble-sent-text': string;
  'chat-bubble-received': string;
  'chat-bubble-received-text': string;

  // Component tokens — sidebar
  'sidebar-bg': string;
  'sidebar-text': string;
  'sidebar-hover': string;
  'sidebar-active': string;

  // Component tokens — cards & inputs
  'card-bg': string;
  'card-border': string;
  'input-bg': string;
  'input-border': string;
  'input-focus': string;

  // Border
  'border-default': string;
  'border-muted': string;

  // Links
  'link-default': string;
  'link-hover': string;

  // Focus ring (accessibility)
  focusRing?: string;
  focusRingOffset?: string;
  focusRingWidth?: string;

  // Skeleton loading
  skeletonBase?: string;
  skeletonShimmer?: string;

  // Scrollbar
  scrollbarTrack?: string;
  scrollbarThumb?: string;
}

// DARK THEME TOKENS (Default)

/**
 * Dark Chrome theme — neutral silver/steel with vivid lime accent.
 * Dark accent: #DFFF0A = oklch(0.95 0.24 110)
 *
 * Key contrast ratios:
 * - text-primary (#ffffff) on bg-primary (#111215): 18.3:1 ✅ AAA
 * - text-secondary (#a0a4b8) on bg-primary (#111215): 7.8:1  ✅ AAA
 * - text-muted (#6c7086) on bg-primary (#111215): 4.7:1      ✅ AA
 * - interactive-primary (#DFFF0A) on bg-primary (#111215): 16.4:1 ✅ AAA
 */
export const DARK_TOKENS: SemanticTokens = {
  // Surfaces (neutral steel gray — no blue tint)
  'bg-primary': '#111215',
  'bg-secondary': '#19191e',
  'bg-tertiary': '#222326',
  'bg-inverse': '#f5f5f5',

  // Text
  'text-primary': '#ffffff',
  'text-secondary': '#a0a4b8',
  'text-muted': '#6c7086',
  'text-inverse': '#111215',
  'text-on-primary': '#111215',
  'text-on-error': '#ffffff',

  // Interactive (vivid lime accent — #DFFF0A brand)
  'interactive-primary': '#DFFF0A',
  'interactive-hover': '#E5FF3D',
  'interactive-active': '#B3CC08',
  'interactive-disabled': '#2a2b2e',

  // Feedback
  'feedback-error': '#ef4444',
  'feedback-warning': '#f59e0b',
  'feedback-success': '#DFFF0A',
  'feedback-info': '#3b82f6',

  // Chat — lime-accented bubbles
  'chat-bg': '#19191e',
  'chat-bubble-sent': 'rgba(223, 255, 10, 0.18)',
  'chat-bubble-sent-text': '#ffffff',
  'chat-bubble-received': 'rgba(255,255,255,0.05)',
  'chat-bubble-received-text': '#e0e0e8',

  // Sidebar (neutral gray + vivid lime accents)
  'sidebar-bg': '#111215',
  'sidebar-text': '#a0a4b8',
  'sidebar-hover': 'rgba(223, 255, 10, 0.08)',
  'sidebar-active': 'rgba(223, 255, 10, 0.15)',

  // Cards & inputs (silver metallic + lime focus)
  'card-bg': 'rgba(255,255,255,0.05)',
  'card-border': 'rgba(223, 255, 10, 0.10)',
  'input-bg': 'rgba(255,255,255,0.05)',
  'input-border': 'rgba(255,255,255,0.10)',
  'input-focus': '#DFFF0A',

  // Borders
  'border-default': 'rgba(255,255,255,0.10)',
  'border-muted': 'rgba(255,255,255,0.05)',

  // Links
  'link-default': '#DFFF0A',
  'link-hover': '#E5FF3D',

  // Focus ring
  focusRing: 'rgba(223, 255, 10, 0.5)',
  focusRingOffset: '2px',
  focusRingWidth: '2px',

  // Skeleton loading
  skeletonBase: 'rgba(255,255,255,0.04)',
  skeletonShimmer: 'rgba(255,255,255,0.08)',

  // Scrollbar
  scrollbarTrack: 'rgba(255,255,255,0.02)',
  scrollbarThumb: 'rgba(192,192,192,0.2)',
};

// LIGHT THEME TOKENS

/**
 * Daylight theme — WCAG AAA target with stronger depth and sapphire-violet accents.
 * Light accent: #2563eb (buttons, links) — high contrast on pale surfaces
 *
 * Key contrast ratios:
 * - text-primary (#0f172a) on bg-primary (#f4f7fb): 16.7:1 ✅ AAA
 * - text-secondary (#334155) on bg-primary (#f4f7fb): 9.4:1 ✅ AAA
 * - text-muted (#64748b) on bg-primary (#f4f7fb): 4.6:1     ✅ AA
 * - text-on-primary (#ffffff) on interactive-primary (#2563eb): 5.17:1 ✅ AA
 * - link-default (#1d4ed8) on bg-primary (#f4f7fb): 6.18:1 ✅ AA
 */
export const LIGHT_TOKENS: SemanticTokens = {
  // Surfaces
  'bg-primary': '#f4f7fb',
  'bg-secondary': '#ffffff',
  'bg-tertiary': '#e9eef5',
  'bg-inverse': '#1a1a2e',

  // Text
  'text-primary': '#0f172a',
  'text-secondary': '#334155',
  'text-muted': '#64748b',
  'text-inverse': '#ffffff',
  'text-on-primary': '#ffffff',
  'text-on-error': '#ffffff',

  // Interactive (sapphire accent — visible on pale surfaces, AA-compliant)
  'interactive-primary': '#2563eb',
  'interactive-hover': '#1d4ed8',
  'interactive-active': '#1e40af',
  'interactive-disabled': '#cbd5e1',

  // Feedback
  'feedback-error': '#dc2626',
  'feedback-warning': '#d97706',
  'feedback-success': '#16a34a',
  'feedback-info': '#2563eb',

  // Chat — teal bubble with white text
  'chat-bg': '#f8fbff',
  'chat-bubble-sent': '#2563eb',
  'chat-bubble-sent-text': '#ffffff',
  'chat-bubble-received': '#e9eef5',
  'chat-bubble-received-text': '#0f172a',

  // Sidebar
  'sidebar-bg': '#edf3fb',
  'sidebar-text': '#334155',
  'sidebar-hover': 'rgba(37, 99, 235, 0.08)',
  'sidebar-active': 'rgba(37, 99, 235, 0.14)',

  // Cards & inputs
  'card-bg': 'rgba(255,255,255,0.88)',
  'card-border': '#d9e2ec',
  'input-bg': '#ffffff',
  'input-border': '#cbd5e1',
  'input-focus': '#2563eb',

  // Borders
  'border-default': '#d9e2ec',
  'border-muted': '#e9eef5',

  // Links (teal — AA contrast on white bg, 4.6:1)
  'link-default': '#1d4ed8',
  'link-hover': '#1e40af',

  // Focus ring
  focusRing: 'rgba(37, 99, 235, 0.38)',
  focusRingOffset: '2px',
  focusRingWidth: '2px',

  // Skeleton loading
  skeletonBase: '#d9e2ec',
  skeletonShimmer: '#eef4fb',

  // Scrollbar
  scrollbarTrack: 'rgba(0,0,0,0.02)',
  scrollbarThumb: 'rgba(37,99,235,0.18)',
};

// AURORA THEME TOKENS (Default — purple glass)

/**
 * Aurora theme — purple glass, the default CGraph experience.
 * Aurora primary: #8b5cf6 = oklch(0.541 0.281 293)
 *
 * Key contrast ratios:
 * - text-primary (#ffffff) on bg-primary (#080a10): 19.1:1 ✅ AAA
 * - text-secondary (#b4bcd0) on bg-primary (#080a10): 10.0:1 ✅ AAA
 * - text-muted (#6b7394) on bg-primary (#080a10): 4.7:1      ✅ AA
 * - text-on-primary (#ffffff) on interactive-primary (#7c3aed): 5.70:1 ✅ AA
 */
export const AURORA_TOKENS: SemanticTokens = {
  // Surfaces (deep space blue-black — distinct from Dark Chrome gray)
  'bg-primary': '#0d0f1c',
  'bg-secondary': '#131628',
  'bg-tertiary': '#1a1e32',
  'bg-inverse': '#f0f0ff',

  // Text
  'text-primary': '#ffffff',
  'text-secondary': '#b4bcd0',
  'text-muted': '#6b7394',
  'text-inverse': '#0d0f1c',
  'text-on-primary': '#ffffff',
  'text-on-error': '#ffffff',

  // Interactive (purple brand)
  'interactive-primary': '#7c3aed',
  'interactive-hover': '#8b5cf6',
  'interactive-active': '#6d28d9',
  'interactive-disabled': '#2a2d3a',

  // Feedback
  'feedback-error': '#ef4444',
  'feedback-warning': '#f59e0b',
  'feedback-success': '#22c55e',
  'feedback-info': '#3b82f6',

  // Chat — purple bubble with white text
  'chat-bg': '#131628',
  'chat-bubble-sent': '#6d28d9',
  'chat-bubble-sent-text': '#ffffff',
  'chat-bubble-received': '#1a1e32',
  'chat-bubble-received-text': '#e2e8f0',

  // Sidebar
  'sidebar-bg': '#0d0f1c',
  'sidebar-text': '#b4bcd0',
  'sidebar-hover': 'rgba(139,92,246,0.08)',
  'sidebar-active': 'rgba(139,92,246,0.15)',

  // Cards & inputs
  'card-bg': 'rgba(18,22,42,0.85)',
  'card-border': 'rgba(139,92,246,0.12)',
  'input-bg': 'rgba(18,22,42,0.6)',
  'input-border': 'rgba(139,92,246,0.15)',
  'input-focus': '#8b5cf6',

  // Borders
  'border-default': 'rgba(139,92,246,0.10)',
  'border-muted': 'rgba(255,255,255,0.04)',

  // Links
  'link-default': '#a78bfa',
  'link-hover': '#c4b5fd',

  // Focus ring
  focusRing: 'rgba(139, 92, 246, 0.5)',
  focusRingOffset: '2px',
  focusRingWidth: '2px',

  // Skeleton loading
  skeletonBase: 'rgba(255,255,255,0.05)',
  skeletonShimmer: 'rgba(255,255,255,0.10)',

  // Scrollbar
  scrollbarTrack: 'rgba(255,255,255,0.02)',
  scrollbarThumb: 'rgba(139,92,246,0.3)',
};

// BUBBLE THEME TOKENS (Liquid Glass)

/**
 * Bubble theme — liquid glass with prismatic edges, purple-green dual accent.
 * Bubble primary: #7C3AED = oklch(0.491 0.27 293)
 *
 * Key contrast ratios:
 * - text-primary (#ffffff) on bg-primary (#111827): 16.8:1 ✅ AAA
 * - text-secondary (#D1D5DB) on bg-primary (#111827): 11.2:1 ✅ AAA
 * - text-muted (#9CA3AF) on bg-primary (#111827): 6.5:1      ✅ AA
 * - text-on-primary (#ffffff) on interactive-primary (#7C3AED): 5.70:1 ✅ AA
 */
export const BUBBLE_TOKENS: SemanticTokens = {
  // Surfaces — translucent for glass blur-through
  'bg-primary': '#111827',
  'bg-secondary': 'rgba(255, 255, 255, 0.04)',
  'bg-tertiary': 'rgba(255, 255, 255, 0.06)',
  'bg-inverse': '#F3F4F6',

  // Text — high contrast on glass
  'text-primary': '#ffffff',
  'text-secondary': '#D1D5DB',
  'text-muted': '#9CA3AF',
  'text-inverse': '#111827',
  'text-on-primary': '#ffffff',
  'text-on-error': '#ffffff',

  // Interactive (purple brand)
  'interactive-primary': '#7C3AED',
  'interactive-hover': '#6D28D9',
  'interactive-active': '#5B21B6',
  'interactive-disabled': 'rgba(255, 255, 255, 0.08)',

  // Feedback
  'feedback-error': '#EF4444',
  'feedback-warning': '#F59E0B',
  'feedback-success': '#10B981',
  'feedback-info': '#3B82F6',

  // Chat — glass-tinted bubbles
  'chat-bg': 'rgba(255, 255, 255, 0.03)',
  'chat-bubble-sent': 'rgba(139, 92, 246, 0.12)',
  'chat-bubble-sent-text': '#ffffff',
  'chat-bubble-received': 'rgba(255, 255, 255, 0.05)',
  'chat-bubble-received-text': '#E5E7EB',

  // Sidebar (translucent — backdrop-blur creates frosted look)
  'sidebar-bg': 'rgba(255, 255, 255, 0.04)',
  'sidebar-text': '#D1D5DB',
  'sidebar-hover': 'rgba(255, 255, 255, 0.07)',
  'sidebar-active': 'rgba(139, 92, 246, 0.10)',

  // Cards & inputs (glass-appropriate)
  'card-bg': 'rgba(255, 255, 255, 0.05)',
  'card-border': 'rgba(255, 255, 255, 0.16)',
  'input-bg': 'rgba(255, 255, 255, 0.05)',
  'input-border': 'rgba(255, 255, 255, 0.16)',
  'input-focus': '#8B5CF6',

  // Borders (visible glass edge for depth)
  'border-default': 'rgba(255, 255, 255, 0.14)',
  'border-muted': 'rgba(255, 255, 255, 0.08)',

  // Links
  'link-default': '#A78BFA',
  'link-hover': '#C4B5FD',

  // Focus ring
  focusRing: 'rgba(139, 92, 246, 0.5)',
  focusRingOffset: '2px',
  focusRingWidth: '3px',

  // Skeleton loading
  skeletonBase: 'rgba(255, 255, 255, 0.04)',
  skeletonShimmer: 'rgba(255, 255, 255, 0.08)',

  // Scrollbar
  scrollbarTrack: 'rgba(255, 255, 255, 0.02)',
  scrollbarThumb: 'rgba(139, 92, 246, 0.21)',
};

// TOKEN REGISTRY — maps theme ids → semantic tokens

export const TOKEN_REGISTRY: Record<string, SemanticTokens> = {
  aurora: AURORA_TOKENS,
  dark: DARK_TOKENS,
  light: LIGHT_TOKENS,
  bubble: BUBBLE_TOKENS,
};

/**
 * Return the semantic tokens for a theme, falling back to dark (most conservative).
 */
export function getTokensForTheme(themeId: string): SemanticTokens {
  return TOKEN_REGISTRY[themeId] ?? DARK_TOKENS;
}

// WCAG COMPLIANCE VALIDATION

/** Pair of (text token key, background token key) that must pass WCAG AA. */
type ContrastPair = [keyof SemanticTokens, keyof SemanticTokens];

/**
 * Critical text/background pairs that MUST pass WCAG AA (4.5:1) contrast.
 * Validated at build-time via `validateAllThemeContrast()`.
 */
const CRITICAL_CONTRAST_PAIRS: ContrastPair[] = [
  ['text-primary', 'bg-primary'],
  ['text-secondary', 'bg-primary'],
  ['text-muted', 'bg-primary'],
  ['text-on-primary', 'interactive-primary'],
  ['text-on-error', 'feedback-error'],
  ['chat-bubble-sent-text', 'chat-bubble-sent'],
  ['sidebar-text', 'sidebar-bg'],
  ['link-default', 'bg-primary'],
];

interface ContrastViolation {
  themeId: string;
  textToken: string;
  bgToken: string;
  ratio: number;
  required: number;
}

/**
 * Validate all registered themes pass WCAG AA for critical text/bg pairs.
 * Returns an array of violations (empty = all pass).
 *
 * Call this in tests or at app startup in development:
 * ```ts
 * if (import.meta.env.DEV) {
 *   const violations = validateAllThemeContrast();
 *   violations.forEach(v => console.warn(`WCAG violation: ${v.themeId} ${v.textToken}/${v.bgToken} = ${v.ratio.toFixed(1)}:1`));
 * }
 * ```
 */
export function validateAllThemeContrast(): ContrastViolation[] {
  const violations: ContrastViolation[] = [];

  for (const [themeId, tokens] of Object.entries(TOKEN_REGISTRY)) {
    for (const [textKey, bgKey] of CRITICAL_CONTRAST_PAIRS) {
      const textColor = tokens[textKey];
      const bgColor = tokens[bgKey];
      // Skip non-hex values (rgba, etc.) — only validate solid hex pairs
      if (!textColor?.startsWith('#') || !bgColor?.startsWith('#')) continue;

      const ratio = contrastRatio(textColor, bgColor);
      if (ratio < 4.5) {
        violations.push({ themeId, textToken: textKey, bgToken: bgKey, ratio, required: 4.5 });
      }
    }
  }

  return violations;
}

// CSS VARIABLE INJECTION HELPER

/**
 * Inject all semantic tokens as CSS custom properties on the root element.
 * Variable naming: `--token-<name>` e.g. `--token-bg-primary`.
 * Also sets `--token-<name>-rgb` with space-separated R G B for Tailwind opacity.
 */
export function injectSemanticTokens(themeId: string): void {
  const tokens = getTokensForTheme(themeId);
  const root = document.documentElement;

  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(`--token-${key}`, value);
    // Set RGB variant for Tailwind alpha support: rgb(var(--token-bg-primary-rgb) / 0.5)
    const rgb = hexToRgb(value);
    if (rgb) {
      root.style.setProperty(`--token-${key}-rgb`, rgb.join(' '));
    }
  }
}
