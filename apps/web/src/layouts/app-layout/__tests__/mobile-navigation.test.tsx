import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { User } from '@/modules/auth/store';
import { navItems } from '../constants';
import { MobileNavigation } from '../mobile-navigation';

vi.mock('@/shared/components/ui', () => ({
  Button: ({
    children,
    animated: _animated,
    isLoading,
    variant: _variant,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    animated?: boolean;
    isLoading?: boolean;
    variant?: string;
  }) => (
    <button {...props} disabled={props.disabled || isLoading}>
      {children}
    </button>
  ),
  Dialog: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <>{children}</> : null),
  DialogContent: ({
    children,
    ariaLabel,
  }: {
    children: React.ReactNode;
    ariaLabel?: string;
  }) => (
    <div role="dialog" aria-label={ariaLabel}>
      {children}
    </div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

const user = {
  id: 'user-1',
  username: 'trick',
  displayName: 'Trick',
} as User;

function MobileNavigationHarness({
  handleLogout = vi.fn(),
  totalUnread = 0,
  unreadCount = 0,
}: {
  handleLogout?: () => void | Promise<void>;
  totalUnread?: number;
  unreadCount?: number;
}) {
  const location = useLocation();

  return (
    <MobileNavigation
      user={user}
      location={location}
      handleLogout={handleLogout}
      totalUnread={totalUnread}
      unreadCount={unreadCount}
      navItems={navItems}
    />
  );
}

function renderNavigation(
  props: Parameters<typeof MobileNavigationHarness>[0] = {},
  route = '/messages',
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <MobileNavigationHarness {...props} />
    </MemoryRouter>,
  );
}

describe('MobileNavigation', () => {
  it('keeps four primary destinations visible and moves the rest behind More', () => {
    renderNavigation();

    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toHaveClass(
      'lg:hidden',
    );
    expect(screen.getByRole('link', { name: 'Chats' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Groups' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Discover' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forums' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Spaces' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More navigation options' })).toBeInTheDocument();
  });

  it('shows message and overflow unread state and exposes every remaining route', async () => {
    const interaction = userEvent.setup();
    renderNavigation({ totalUnread: 7, unreadCount: 3 });

    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    await interaction.click(screen.getByRole('button', { name: 'More navigation options' }));

    expect(screen.getByRole('dialog', { name: 'More navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Spaces' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('requires confirmation and runs the logout owner once', async () => {
    const interaction = userEvent.setup();
    const handleLogout = vi.fn().mockResolvedValue(undefined);
    renderNavigation({ handleLogout });

    await interaction.click(screen.getByRole('button', { name: 'More navigation options' }));
    await interaction.click(screen.getByRole('button', { name: 'Log out' }));

    expect(screen.getByRole('dialog', { name: 'Confirm logout' })).toBeInTheDocument();
    expect(handleLogout).not.toHaveBeenCalled();

    await interaction.click(screen.getByRole('button', { name: 'Log out' }));
    expect(handleLogout).toHaveBeenCalledOnce();
  });
});
