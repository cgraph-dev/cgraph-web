import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const { mockDelete, mockPost, mockLogout } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockPost: vi.fn(),
  mockLogout: vi.fn(),
}));

vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop !== 'string') return undefined;
        return ({
          children,
          className,
          onClick,
          ...rest
        }: React.PropsWithChildren<Record<string, unknown>>) => {
          const Element = prop as React.ElementType;
          const domProps = { ...rest };
          delete domProps.animate;
          delete domProps.exit;
          delete domProps.initial;
          delete domProps.transition;
          delete domProps.variants;
          delete domProps.whileHover;
          delete domProps.whileTap;
          return (
            <Element
              className={className as string}
              onClick={onClick as React.MouseEventHandler}
              {...domProps}
            >
              {children}
            </Element>
          );
        };
      },
    }
  ),
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ArrowUturnLeftIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  ExclamationTriangleIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
  TrashIcon: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children }: React.PropsWithChildren) => (
    <div data-testid="glass-card">{children}</div>
  ),
}));

vi.mock('@/lib/api', () => ({
  api: {
    delete: mockDelete,
    post: mockPost,
  },
  getErrorMessage: () => 'Failed to delete account. Please check your password.',
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({
    logout: mockLogout,
  }),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    light: vi.fn(),
    heavy: vi.fn(),
    selection: vi.fn(),
  },
}));

import { DeleteAccount } from '../delete-account';

describe('DeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockResolvedValue({ data: { message: 'Account deletion cancelled.' } });
    mockPost.mockResolvedValue({});
  });

  it('uses the password-confirmed account deletion endpoint', async () => {
    render(<DeleteAccount />);

    fireEvent.click(screen.getByText('Start Deletion Process'));
    fireEvent.change(screen.getByPlaceholderText('Enter your current password'), {
      target: { value: 'correct-password' },
    });
    fireEvent.change(screen.getByPlaceholderText('Type DELETE to confirm'), {
      target: { value: 'DELETE' },
    });
    fireEvent.click(screen.getByText('Final Confirmation'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/v1/me/delete-account', {
        password: 'correct-password',
      });
    });
    expect(mockLogout).toHaveBeenCalled();
  });

  it('uses the cancel-deletion endpoint for grace-period recovery', async () => {
    render(<DeleteAccount />);

    fireEvent.click(screen.getByText('Cancel Pending Deletion'));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/api/v1/me/delete-account');
    });
    expect(await screen.findByText('Account deletion cancelled.')).toBeInTheDocument();
  });
});
