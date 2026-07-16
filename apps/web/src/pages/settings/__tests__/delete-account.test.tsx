import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockLogout, mockRequest } = vi.hoisted(() => ({
  mockLogout: vi.fn(),
  mockRequest: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    accountDeletion: {
      request: mockRequest,
    },
  },
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: (selector: (state: { logout: typeof mockLogout }) => unknown) =>
    selector({ logout: mockLogout }),
}));

interface MockButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly animated?: boolean;
  readonly leftIcon?: React.ReactNode;
  readonly variant?: string;
  readonly ref?: React.Ref<HTMLButtonElement>;
}

vi.mock('@/shared/components/ui', () => ({
  Button: ({
    animated: _animated,
    children,
    leftIcon,
    variant: _variant,
    ...props
  }: MockButtonProps) => (
    <button {...props}>
      {leftIcon}
      {children}
    </button>
  ),
  Dialog: ({
    children,
    open,
  }: {
    readonly children: React.ReactNode;
    readonly open: boolean;
  }) => (open ? <>{children}</> : null),
  DialogContent: ({
    ariaDescribedBy,
    ariaLabelledBy,
    children,
  }: {
    readonly ariaDescribedBy?: string;
    readonly ariaLabelledBy?: string;
    readonly children: React.ReactNode;
  }) => (
    <div role="dialog" aria-labelledby={ariaLabelledBy} aria-describedby={ariaDescribedBy}>
      {children}
    </div>
  ),
}));

import { DeleteAccount } from '../delete-account';

const deletionResponse = {
  status: 'pending' as const,
  message: 'Account scheduled for permanent anonymization',
  requested_at: '2026-07-16T10:00:00.000Z',
  hard_delete_at: '2026-08-15T10:00:00.000Z',
  grace_period_days: 30,
  already_pending: false,
};

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

async function completeConfirmation(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Request account deletion' }));
  await user.type(screen.getByLabelText('Current password'), 'correct-password');
  await user.type(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
}

describe('DeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest.mockResolvedValue({ ok: true, data: deletionResponse });
    mockLogout.mockResolvedValue(undefined);
  });

  it('renders only backend-proven consequences and the relogin recovery path', () => {
    render(<DeleteAccount />);

    expect(screen.getByText(/permanently anonymizes the account/i)).toBeInTheDocument();
    expect(screen.getByText(/successfully signing in/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel pending deletion/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/all your chats, groups, and contacts/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/subscriptions.*terminated/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/30-day grace period/i)).not.toBeInTheDocument();
  });

  it('moves focus into confirmation and returns it after cancellation', async () => {
    const user = userEvent.setup();
    render(<DeleteAccount />);

    const trigger = screen.getByRole('button', { name: 'Request account deletion' });
    await user.click(trigger);

    expect(screen.getByLabelText('Current password')).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('requires a password and the exact DELETE confirmation', async () => {
    const user = userEvent.setup();
    render(<DeleteAccount />);

    await user.click(screen.getByRole('button', { name: 'Request account deletion' }));
    const submit = screen.getByRole('button', { name: 'Request deletion' });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Current password'), 'correct-password');
    await user.type(screen.getByLabelText('Type DELETE to confirm'), 'delete');
    expect(submit).toBeDisabled();

    await user.clear(screen.getByLabelText('Type DELETE to confirm'));
    await user.type(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
    expect(submit).toBeEnabled();
  });

  it('uses the typed endpoint, presents server timing, and awaits logout cleanup', async () => {
    const user = userEvent.setup();
    const logout = deferred<void>();
    mockLogout.mockReturnValueOnce(logout.promise);
    render(<DeleteAccount />);

    await completeConfirmation(user);
    await user.click(screen.getByRole('button', { name: 'Request deletion' }));

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith({ password: 'correct-password' });
    });
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Deletion request accepted')).toBeInTheDocument();
    expect(screen.getByText('30 days')).toBeInTheDocument();
    expect(screen.getByText('Signing out and clearing local account data...')).toBeInTheDocument();
    expect(
      screen.getByText('Permanent anonymization').parentElement?.querySelector('time')
    ).toHaveAttribute('datetime', deletionResponse.hard_delete_at);

    logout.resolve();
    expect(await screen.findByText('Local account data cleared.')).toBeInTheDocument();
  });

  it('shows typed request errors without signing out and allows retry', async () => {
    const user = userEvent.setup();
    mockRequest.mockResolvedValueOnce({
      ok: false,
      status: 401,
      error: { code: 'invalid_password', message: 'The current password is incorrect.' },
    });
    render(<DeleteAccount />);

    await completeConfirmation(user);
    await user.click(screen.getByRole('button', { name: 'Request deletion' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The current password is incorrect.');
    expect(mockLogout).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Request deletion' })).toBeEnabled();
  });

  it('keeps an accepted request visible when local logout cleanup fails', async () => {
    const user = userEvent.setup();
    mockLogout.mockRejectedValueOnce(new Error('cleanup failed'));
    render(<DeleteAccount />);

    await completeConfirmation(user);
    await user.click(screen.getByRole('button', { name: 'Request deletion' }));

    expect(await screen.findByText('Deletion request accepted')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The request was accepted, but local sign-out did not finish.'
    );
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it('blocks duplicate submissions while the typed request is pending', async () => {
    const user = userEvent.setup();
    const request = deferred<{ ok: true; data: typeof deletionResponse }>();
    mockRequest.mockReturnValueOnce(request.promise);
    render(<DeleteAccount />);

    await completeConfirmation(user);
    const submit = screen.getByRole('button', { name: 'Request deletion' });
    await user.dblClick(submit);

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Submitting request...' })).toBeDisabled();

    request.resolve({ ok: true, data: deletionResponse });
    expect(await screen.findByText('Deletion request accepted')).toBeInTheDocument();
  });
});
