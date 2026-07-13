import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const sessionsHook = vi.hoisted(() => ({
  sessions: [
    {
      id: 'session-current',
      ip: '203.0.113.24',
      user_agent: 'Mozilla/5.0 Chrome/138.0',
      location: 'Bucharest, Romania',
      current: true,
      last_active_at: '2026-07-13T18:00:00Z',
      created_at: '2026-07-10T12:00:00Z',
    },
    {
      id: 'session-other',
      ip: '198.51.100.8',
      user_agent: 'Mozilla/5.0 Firefox/140.0',
      location: 'Cluj-Napoca, Romania',
      current: false,
      last_active_at: '2026-07-13T17:00:00Z',
      created_at: '2026-07-09T12:00:00Z',
    },
  ],
  isLoading: false,
  isMutating: false,
  error: null as string | null,
  getSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeAllOtherSessions: vi.fn(),
}));

vi.mock('@/modules/auth/hooks', () => ({
  useSessions: vi.fn(() => sessionsHook),
}));

vi.mock('@/shared/components/ui', () => ({
  Button: ({
    children,
    isLoading,
    variant: _variant,
    ...props
  }: Record<string, unknown> & { children?: React.ReactNode; isLoading?: boolean }) => (
    <button {...props} disabled={Boolean(props.disabled) || isLoading}>
      {isLoading ? 'Loading...' : children}
    </button>
  ),
  Dialog: ({
    open,
    children,
  }: Record<string, unknown> & { open?: boolean; children?: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  GlassCard: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

import { SessionsSettingsPanel } from '../sessions-settings-panel';

function renderPanel() {
  return render(<SessionsSettingsPanel />);
}

describe('SessionsSettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionsHook.isLoading = false;
    sessionsHook.isMutating = false;
    sessionsHook.error = null;
    sessionsHook.revokeSession.mockResolvedValue(true);
    sessionsHook.revokeAllOtherSessions.mockResolvedValue(true);
  });

  it('loads the typed session lifecycle on mount', async () => {
    renderPanel();

    await waitFor(() => {
      expect(sessionsHook.getSessions).toHaveBeenCalledTimes(1);
    });
  });

  it('requires confirmation before revoking an individual session', async () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    await screen.findByRole('dialog');
    expect(sessionsHook.revokeSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sessionsHook.revokeSession).not.toHaveBeenCalled();
  });

  it('reconciles an individual revocation through the hook after confirmation', async () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Revoke session' }));

    await waitFor(() => {
      expect(sessionsHook.revokeSession).toHaveBeenCalledWith('session-other');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('confirms and uses the atomic all-other command', async () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Revoke All Other Sessions' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Revoke other sessions' }));

    await waitFor(() => {
      expect(sessionsHook.revokeAllOtherSessions).toHaveBeenCalledTimes(1);
    });
    expect(sessionsHook.revokeSession).not.toHaveBeenCalled();
  });

  it('keeps destructive controls disabled while a revocation is in flight', () => {
    sessionsHook.isMutating = true;
    renderPanel();

    expect(screen.getByRole('button', { name: 'Revoke' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Revoke All Other Sessions' })).toBeDisabled();
  });
});
