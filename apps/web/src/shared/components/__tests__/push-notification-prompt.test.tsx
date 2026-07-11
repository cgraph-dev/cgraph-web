import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pushMocks = vi.hoisted(() => ({
  getVapidPublicKey: vi.fn(),
  requestPushPermission: vi.fn(),
  subscribeToPush: vi.fn(),
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: {
    div: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  },
}));

vi.mock('@/lib/push', () => ({
  getVapidPublicKey: pushMocks.getVapidPublicKey,
  requestPushPermission: pushMocks.requestPushPermission,
  subscribeToPush: pushMocks.subscribeToPush,
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

import { PushNotificationPrompt } from '../push-notification-prompt';

describe('PushNotificationPrompt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    pushMocks.getVapidPublicKey.mockResolvedValue('public-vapid-key');
    pushMocks.requestPushPermission.mockResolvedValue('granted');
    pushMocks.subscribeToPush.mockResolvedValue({ endpoint: 'https://push.example.test/subscription' });
    localStorage.clear();

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission: 'default' },
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {},
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the canonical subscription flow after the delayed user prompt', async () => {
    render(<PushNotificationPrompt />);

    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Enable' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(pushMocks.requestPushPermission).toHaveBeenCalledTimes(1);
    expect(pushMocks.getVapidPublicKey).toHaveBeenCalledTimes(1);
    expect(pushMocks.subscribeToPush).toHaveBeenCalledWith('public-vapid-key');
    expect(screen.queryByRole('button', { name: 'Enable' })).not.toBeInTheDocument();
  });
});
