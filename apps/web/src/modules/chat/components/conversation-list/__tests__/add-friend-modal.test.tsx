import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AddFriendModal } from '../add-friend-modal';

const friendStoreMock = vi.hoisted(() => ({
  sendRequest: vi.fn(),
  clearError: vi.fn(),
  isLoading: false,
  error: null as string | null,
}));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: (selector: (state: typeof friendStoreMock) => unknown) =>
    selector(friendStoreMock),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { success: vi.fn(), error: vi.fn(), medium: vi.fn() },
}));

describe('AddFriendModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    friendStoreMock.isLoading = false;
    friendStoreMock.error = null;
  });

  it('normalizes at-prefixed usernames before sending the request', async () => {
    friendStoreMock.sendRequest.mockResolvedValueOnce(undefined);

    render(<AddFriendModal onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('@username, #UID, email, or user ID'), {
      target: { value: '@tricker' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Request' }));

    await waitFor(() => expect(friendStoreMock.sendRequest).toHaveBeenCalledWith('tricker'));
    expect(screen.getByText('Request sent')).toBeInTheDocument();
  });

  it('closes from the cancel button', () => {
    const onClose = vi.fn();

    render(<AddFriendModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
