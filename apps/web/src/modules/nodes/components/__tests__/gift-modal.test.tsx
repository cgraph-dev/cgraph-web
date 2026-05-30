import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { mockUseSendGift, mockUseNodeWallet } = vi.hoisted(() => ({
  mockUseSendGift: vi.fn(),
  mockUseNodeWallet: vi.fn(),
}));

vi.mock('../../hooks/useNodes', () => ({
  useSendGift: mockUseSendGift,
  useNodeWallet: mockUseNodeWallet,
}));

vi.mock('@cgraph-dev/shared-types/nodes', () => ({
  MIN_TIP: 10,
  PLATFORM_CUT_PERCENT: 20,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop === 'string') {
          return ({
            children,
            ...rest
          }: {
            children?: React.ReactNode;
            [key: string]: unknown;
          }) => {
            const Element = prop as React.ElementType;
            return <Element {...rest}>{children}</Element>;
          };
        }
        return undefined;
      },
    }
  ),
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

import { GiftModal } from '../gift-modal';
import toast from 'react-hot-toast';

function makeDefaultProps(overrides?: Partial<Parameters<typeof GiftModal>[0]>) {
  return {
    isOpen: true,
    onClose: vi.fn(),
    recipientId: 'user-2',
    recipientUsername: 'alice',
    recipientAvatarUrl: null,
    ...overrides,
  };
}

describe('GiftModal', () => {
  let mutateFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mutateFn = vi.fn();
    mockUseSendGift.mockReturnValue({ mutate: mutateFn, isPending: false });
    mockUseNodeWallet.mockReturnValue({
      data: { available_balance: 5000 },
    });
  });
  it('returns null when isOpen is false', () => {
    const { container } = render(<GiftModal {...makeDefaultProps({ isOpen: false })} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows recipient username', () => {
    render(<GiftModal {...makeDefaultProps()} />);
    expect(screen.getAllByText(/@alice/).length).toBeGreaterThan(0);
  });

  it('shows avatar fallback when no avatar URL', () => {
    render(<GiftModal {...makeDefaultProps({ recipientAvatarUrl: null })} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows avatar image when URL is provided', () => {
    render(
      <GiftModal {...makeDefaultProps({ recipientAvatarUrl: 'https://example.com/avatar.png' })} />
    );
    expect(screen.getByAltText('alice')).toBeInTheDocument();
  });
  it('displays correct fee breakdown for default amount (10)', () => {
    render(<GiftModal {...makeDefaultProps()} />);
    // Platform fee (20% of 10 = 2)
    expect(screen.getByText(/Platform fee/)).toBeInTheDocument();
    // Recipient receives 10 - 2 = 8
    expect(screen.getByText(/8/)).toBeInTheDocument();
  });

  it('updates fee breakdown when amount changes', () => {
    render(<GiftModal {...makeDefaultProps()} />);
    const input = screen.getByLabelText(/Amount/);
    fireEvent.change(input, { target: { value: '100' } });

    // Platform fee: 20% of 100 = 20
    // Recipient receives: 100 - 20 = 80
    expect(screen.getByText(/80/)).toBeInTheDocument();
  });
  it('shows minimum gift warning when amount is below 10', () => {
    render(<GiftModal {...makeDefaultProps()} />);
    const input = screen.getByLabelText(/Amount/);
    fireEvent.change(input, { target: { value: '5' } });

    expect(screen.getByText(/Minimum gift is 10 Nodes/)).toBeInTheDocument();
  });

  it('disables send button when amount is below minimum', () => {
    render(<GiftModal {...makeDefaultProps()} />);
    const input = screen.getByLabelText(/Amount/);
    fireEvent.change(input, { target: { value: '5' } });

    const sendButton = screen.getByText('Send Gift');
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when amount meets minimum', () => {
    render(<GiftModal {...makeDefaultProps()} />);
    const input = screen.getByLabelText(/Amount/);
    fireEvent.change(input, { target: { value: '10' } });

    const sendButton = screen.getByText('Send Gift');
    expect(sendButton).not.toBeDisabled();
  });
  it('renders optional message textarea', () => {
    render(<GiftModal {...makeDefaultProps()} />);
    expect(screen.getByPlaceholderText(/Add a personal message/)).toBeInTheDocument();
  });

  it('shows character count for message', () => {
    render(<GiftModal {...makeDefaultProps()} />);
    expect(screen.getByText('0/200')).toBeInTheDocument();
  });

  it('updates character count when typing a message', () => {
    render(<GiftModal {...makeDefaultProps()} />);
    const textarea = screen.getByPlaceholderText(/Add a personal message/);
    fireEvent.change(textarea, { target: { value: 'Happy birthday!' } });
    expect(screen.getByText('15/200')).toBeInTheDocument();
  });
  it('calls API with correct params when send is clicked', () => {
    render(<GiftModal {...makeDefaultProps()} />);
    const input = screen.getByLabelText(/Amount/);
    fireEvent.change(input, { target: { value: '50' } });

    const textarea = screen.getByPlaceholderText(/Add a personal message/);
    fireEvent.change(textarea, { target: { value: 'Enjoy!' } });

    fireEvent.click(screen.getByText('Send Gift'));

    expect(mutateFn).toHaveBeenCalledWith(
      { recipientId: 'user-2', amount: 50, message: 'Enjoy!' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('does not include message when textarea is empty', () => {
    render(<GiftModal {...makeDefaultProps()} />);
    fireEvent.click(screen.getByText('Send Gift'));

    expect(mutateFn).toHaveBeenCalledWith(
      { recipientId: 'user-2', amount: 10, message: undefined },
      expect.any(Object)
    );
  });

  it('shows loading text when mutation is pending', () => {
    mockUseSendGift.mockReturnValue({ mutate: mutateFn, isPending: true });
    render(<GiftModal {...makeDefaultProps()} />);
    expect(screen.getByText(/Sending/)).toBeInTheDocument();
  });

  it('disables send button when mutation is pending', () => {
    mockUseSendGift.mockReturnValue({ mutate: mutateFn, isPending: true });
    render(<GiftModal {...makeDefaultProps()} />);
    expect(screen.getByText(/Sending/)).toBeDisabled();
  });
  it('shows insufficient balance error when amount exceeds balance', () => {
    mockUseNodeWallet.mockReturnValue({
      data: { available_balance: 20 },
    });
    render(<GiftModal {...makeDefaultProps()} />);
    const input = screen.getByLabelText(/Amount/);
    fireEvent.change(input, { target: { value: '50' } });

    expect(screen.getByText(/Insufficient balance/)).toBeInTheDocument();
  });

  it('disables send button when balance is insufficient', () => {
    mockUseNodeWallet.mockReturnValue({
      data: { available_balance: 5 },
    });
    render(<GiftModal {...makeDefaultProps()} />);
    const input = screen.getByLabelText(/Amount/);
    fireEvent.change(input, { target: { value: '10' } });

    const sendButton = screen.getByText('Send Gift');
    expect(sendButton).toBeDisabled();
  });
  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<GiftModal {...makeDefaultProps({ onClose })} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows self-gift copy when the server rejects sending Nodes to yourself', () => {
    render(<GiftModal {...makeDefaultProps()} />);

    fireEvent.click(screen.getByText('Send Gift'));

    const { onError } = mutateFn.mock.calls[0]![1];
    onError({
      response: {
        data: {
          error: {
            code: 'self_gift',
            message: 'Cannot gift yourself',
          },
        },
      },
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Cannot send Nodes to yourself. Choose another recipient.'
    );
  });

  it('shows rate-limit copy when the server throttles gifts', () => {
    render(<GiftModal {...makeDefaultProps()} />);

    fireEvent.click(screen.getByText('Send Gift'));

    const { onError } = mutateFn.mock.calls[0]![1];
    onError({
      response: {
        data: {
          error: {
            code: 'rate_limited',
            message: 'Too many attempts',
          },
        },
      },
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Too many attempts. Please wait a moment and try again.'
    );
  });
});
