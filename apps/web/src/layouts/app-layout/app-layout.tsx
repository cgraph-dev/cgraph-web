/**
 * AppLayout Component - Main application shell with sidebar and content area
 */
import { lazy, Suspense } from 'react';
import { ToastContainer } from '@/shared/components/ui';
import { pageTransitions, buttonVariantsSubtle } from '@/lib/animations/transitions';
import { useAppLayout } from './hooks';
import { navItems } from './constants';
import Sidebar from './sidebar';
import { AnimatedOutlet } from './animated-outlet';
import {
  AriaLiveRegion,
  AssertiveLiveRegion,
  useKeyboardNavigation,
  useHighContrast,
} from '@/shared/components/accessibility';
import { OnboardingTutorial } from '@/modules/onboarding/onboarding-tutorial';

// Reserved for future animation enhancements
void pageTransitions;
void buttonVariantsSubtle;

const MobileNavigation = lazy(() => import('./mobile-navigation'));

/**
 * App Layout — page layout wrapper.
 */
export default function AppLayout() {
  const { location, user, theme, handleLogout, totalUnread, unreadCount } = useAppLayout();
  const isOpenConversation = location.pathname.startsWith('/messages/');
  useKeyboardNavigation();
  useHighContrast();

  return (
    <div
      className={`relative flex h-dvh min-h-dvh flex-col text-[var(--token-text-primary)] lg:h-screen lg:min-h-screen lg:flex-row ${
        theme.category !== 'light' ? 'bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950' : ''
      }`}
      style={{
        background: theme.category === 'light' ? theme.colors.background : undefined,
      }}
    >
      {/* Brand ambient background — replacing defaults with Social Hub mesh aesthetic */}
      {theme.category !== 'light' && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {/* Background mesh gradient */}
          <div className="bg-primary-500/[0.04] absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full blur-[120px]" />
          <div className="bg-purple-500/[0.04] absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full blur-[120px]" />
        </div>
      )}

      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar
        user={user}
        location={location}
        handleLogout={handleLogout}
        totalUnread={totalUnread}
        unreadCount={unreadCount}
        navItems={navItems}
      />

      {/* Main Content */}
      <main
        id="main-content"
        className="z-0 flex min-h-0 min-w-0 flex-1 overflow-hidden bg-transparent"
        role="main"
      >
        <AnimatedOutlet />
      </main>

      {!isOpenConversation ? (
        <Suspense fallback={null}>
          <MobileNavigation
            user={user}
            location={location}
            handleLogout={handleLogout}
            totalUnread={totalUnread}
            unreadCount={unreadCount}
            navItems={navItems}
          />
        </Suspense>
      ) : null}

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Post-registration onboarding tutorial */}
      <OnboardingTutorial />

      {/* Accessibility: Screen reader live regions */}
      <AriaLiveRegion />
      <AssertiveLiveRegion />
    </div>
  );
}
