/**
 * Vitest Test Setup
 *
 * Global test configuration and mocks.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

// framer-motion, @heroicons/react/* are aliased via resolve.alias in
// vite.config.ts to lightweight stub files in src/test/__mocks__/.
// This is necessary because vi.mock() in setup files causes vitest to
// hang in jsdom mode when any test transitively imports the mocked module.
// See src/test/__mocks__/framer-motion.tsx and heroicons-*.tsx.

// @/lib/animation-presets — stub all named exports
vi.mock('@/lib/animation-presets', () => {
  const emptyVariants = { initial: {}, animate: {}, exit: {} };
  const noop = () => ({});
  const s = { type: 'spring', stiffness: 100, damping: 10 };
  const t = (d: number, ease = 'easeOut') => ({ duration: d, ease });
  return {
    springs: {
      gentle: s,
      default: s,
      bouncy: s,
      snappy: s,
      superBouncy: s,
      dramatic: s,
      wobbly: s,
      stiff: s,
      smooth: s,
      ultraSmooth: s,
    },
    tweens: {
      instant: t(0.1),
      quickFade: t(0.15),
      fast: t(0.2),
      brisk: t(0.25),
      standard: t(0.3, 'easeInOut'),
      moderate: t(0.4, 'easeInOut'),
      smooth: t(0.5),
      emphatic: t(0.6),
      dramatic: t(0.8),
      slow: t(1, 'easeInOut'),
      verySlow: t(1.5, 'easeInOut'),
      ambient: t(2, 'linear'),
      ambientSlow: t(2.5, 'linear'),
      decorative: t(3, 'linear'),
      glacial: t(4, 'easeInOut'),
    },
    loop: (base: Record<string, unknown> = {}) => ({ ...base, repeat: Infinity }),
    loopWithDelay: (base: Record<string, unknown>, repeatDelay: number) => ({
      ...base,
      repeat: Infinity,
      repeatDelay,
    }),
    staggerConfigs: {
      fast: { staggerChildren: 0.05, delayChildren: 0.1 },
      standard: { staggerChildren: 0.1, delayChildren: 0.2 },
      slow: { staggerChildren: 0.15, delayChildren: 0.3 },
      grid: { staggerChildren: 0.03, delayChildren: 0.05 },
    },
    entranceVariants: emptyVariants,
    durationsSec: { fast: 0.15, normal: 0.25, slow: 0.4 },
    chatBubbleAnimations: {},
    hoverAnimations: emptyVariants,
    createPulseAnimation: noop,
    createFireAnimation: noop,
    createElectricAnimation: noop,
    particleAnimations: emptyVariants,
    backgroundAnimations: emptyVariants,
    getStaggerDelay: () => 0,
    createRepeatTransition: noop,
    createSpring: noop,
    getRarityGlow: () => '',
    getTierGlow: () => '',
    default: s,
  };
});

// @/lib/animations/animation-engine — stub haptics and animation helpers
vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    light: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    selection: vi.fn(),
  },
  withHaptics: (fn: () => void) => fn,
  springPresets: { gentle: {}, bouncy: {}, stiff: {} },
}));

// Explicit object stubs (not Proxy) to avoid vitest jsdom hangs.
// Each export used in the codebase gets its own stub component.

const createUIStub = () => {
  /**
   * Validate that a value is a React.ReactNode.
   * React nodes are: null, undefined, string, number, boolean, ReactElement, or arrays thereof.
   * In test stubs, children from mocked components are always valid nodes.
   */
  function isReactNode(value: unknown): value is React.ReactNode {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
      return true;
    if (Array.isArray(value)) return true;
    if (typeof value === 'object' && value !== null && '$$typeof' in value) return true;
    return false;
  }

  const uiOnlyProps = new Set([
    'borderGradient',
    'glow',
    'glowColor',
    'hover3D',
    'intensity',
    'particles',
    'secondaryColor',
    'shimmer',
    'spotlight',
    'themeVariant',
    'variant',
  ]);

  const toDomProps = (props: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(props).filter(([key]) => !uiOnlyProps.has(key)));

  const comp =
    (name: string) => (props: Record<string, unknown> & { ref?: React.Ref<unknown> }) => {
      const { children, ref, ...rest } = props;
      const elementProps: Record<string, unknown> = {
        ...toDomProps(rest),
        ref,
        'data-testid': `ui-${name}`,
      };
      return createElement('div', elementProps, isReactNode(children) ? children : null);
    };
  const toastFn = Object.assign(() => {}, {
    success: () => {},
    error: () => {},
    warning: () => {},
    info: () => {},
    dismiss: () => {},
  });
  return {
    __esModule: true,
    // @/shared/components/ui exports
    AnimatedAvatar: comp('AnimatedAvatar'),
    Avatar: comp('Avatar'),
    Button: comp('Button'),
    DisplayName: comp('DisplayName'),
    FireText: comp('FireText'),
    GlassCard: comp('GlassCard'),
    GlassCardNeon: comp('GlassCardNeon'),
    GlowText: comp('GlowText'),
    InlineTitle: comp('InlineTitle'),
    TiltCard: comp('TiltCard'),
    toast: toastFn,
    ToastContainer: comp('ToastContainer'),
    // useAvatarStyle removed — CSS border system deleted
    // @/components/ui exports
    Skeleton: comp('Skeleton'),
    CommentSkeleton: comp('CommentSkeleton'),
    ForumCardSkeleton: comp('ForumCardSkeleton'),
    PostCardSkeleton: comp('PostCardSkeleton'),
    // Catch-all default
    default: comp('UIDefault'),
  };
};

vi.mock('@/components/ui', () => createUIStub());
vi.mock('@/shared/components/ui', () => createUIStub());
vi.mock('@/components/ui/glass-card', () => createUIStub());
vi.mock('@/components/ui/animated-avatar', () => createUIStub());
vi.mock('@/components/ui/tilt-card', () => createUIStub());
vi.mock('@/components/ui/glow-text', () => createUIStub());
vi.mock('@/components/ui/animated-border', () => createUIStub());

// Mock logger to prevent circular dependency issues in test environment
// (logger → error-tracking → react.tsx can fail during module evaluation)
vi.mock('@/lib/logger', () => {
  const noop = () => {};
  const createLogger = (_namespace: string) => ({
    debug: noop,
    info: noop,
    log: noop,
    warn: noop,
    error: noop,
    time: noop,
    timeEnd: noop,
    breadcrumb: noop,
  });
  return {
    createLogger,
    logger: createLogger('CGraph'),
    socketLogger: createLogger('Socket'),
    e2eeLogger: createLogger('E2EE'),
    authLogger: createLogger('Auth'),
    apiLogger: createLogger('API'),
    forumLogger: createLogger('Forum'),
    chatLogger: createLogger('Chat'),
    themeLogger: createLogger('Theme'),
    routeLogger: createLogger('Route'),
  };
});

// MSW server for API mocking
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

export { server };

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Silence console errors/warnings in tests unless specifically testing them
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn((...args: unknown[]) => {
    // Only show actual errors, not React warnings
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return;
    }
    originalError.apply(console, args);
  });

  console.warn = vi.fn((...args: unknown[]) => {
    originalWarn.apply(console, args);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
