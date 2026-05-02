/**
 * ServerSidebar Component Tests
 *
 * Tests for the full server sidebar: header, optional banner,
 * channel list area, user bar, and status display.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// --- Mocks (must come before component import) ---

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <div {...rest}>{children}</div>
    ),
    button: ({
      children,
      whileTap: _wt,
      ...rest
    }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <button {...rest}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/solid', () => ({
  MicrophoneIcon: (p: Record<string, unknown>) => <svg data-testid="mic-icon" {...p} />,
  SpeakerWaveIcon: (p: Record<string, unknown>) => <svg data-testid="speaker-icon" {...p} />,
  Cog6ToothIcon: (p: Record<string, unknown>) => <svg data-testid="settings-icon" {...p} />,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: (p: Record<string, unknown>) => <svg data-testid="mic-off-icon" {...p} />,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-testid="scroll-area" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  default: ({ children, content }: { children?: React.ReactNode; content?: string }) => (
    <div data-testid={`tooltip-${content}`}>{children}</div>
  ),
}));

vi.mock('../server-header', () => ({
  ServerHeader: ({ serverName }: { serverName: string }) => (
    <div data-testid="server-header">{serverName}</div>
  ),
}));

vi.mock('../server-banner', () => ({
  ServerBanner: ({ imageUrl }: { imageUrl: string }) => (
    <img data-testid="server-banner" src={imageUrl} alt="banner" />
  ),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn((selector: (state: { user: null }) => unknown) => selector({ user: null })),
}));

import { ServerSidebar } from '../server-sidebar';

// --- Tests ---

describe('ServerSidebar', () => {
  const testUser = {
    id: 'u-1',
    displayName: 'Test User',
    username: 'test-user',
    status: 'online' as const,
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders with default server name when no server prop', () => {
    render(<ServerSidebar />);
    expect(screen.getByTestId('server-header')).toHaveTextContent('CGraph');
  });

  it('renders with provided server name', () => {
    render(<ServerSidebar server={{ id: 's-1', name: 'My Server' }} />);
    expect(screen.getByTestId('server-header')).toHaveTextContent('My Server');
  });

  it('renders server banner when bannerUrl is provided', () => {
    render(<ServerSidebar server={{ id: 's-1', name: 'Srv', bannerUrl: '/banner.png' }} />);
    expect(screen.getByTestId('server-banner')).toHaveAttribute('src', '/banner.png');
  });

  it('does not render banner when no bannerUrl', () => {
    render(<ServerSidebar server={{ id: 's-1', name: 'Srv' }} />);
    expect(screen.queryByTestId('server-banner')).not.toBeInTheDocument();
  });

  it('renders the scroll area for channel list', () => {
    render(<ServerSidebar />);
    expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
  });

  it('renders UserBar with user initial', () => {
    render(<ServerSidebar user={testUser} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('displays user display name', () => {
    render(<ServerSidebar user={testUser} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('displays username', () => {
    render(<ServerSidebar user={testUser} />);
    expect(screen.getByText('test-user')).toBeInTheDocument();
  });

  it('renders audio control buttons', () => {
    render(<ServerSidebar user={testUser} />);
    expect(screen.getByTestId('tooltip-Mute')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-Deafen')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-User Settings')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ServerSidebar className="custom-class" />);
    const sidebar = container.firstElementChild;
    expect(sidebar?.className).toContain('custom-class');
  });

  it('renders an online status indicator dot', () => {
    const { container } = render(<ServerSidebar user={testUser} />);
    const statusDot = container.querySelector('.bg-green-500');
    expect(statusDot).toBeTruthy();
  });
});
