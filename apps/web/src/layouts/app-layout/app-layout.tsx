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
      className="cgraph-app-shell relative flex h-dvh min-h-dvh flex-col text-[var(--token-text-primary)] lg:h-screen lg:min-h-screen lg:flex-row"
      style={{
        background: theme.category === 'light' ? theme.colors.background : undefined,
      }}
    >
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
        className="cgraph-workspace z-0 flex min-h-0 min-w-0 flex-1 overflow-hidden"
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
