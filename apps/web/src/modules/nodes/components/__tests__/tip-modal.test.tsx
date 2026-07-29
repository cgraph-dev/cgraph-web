import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { mockUseSendTip, mockUseNodeWallet, mockUseSpendableNodeBalance } = vi.hoisted(() => ({
  mockUseSendTip: vi.fn(),
  mockUseNodeWallet: vi.fn(),
  mockUseSpendableNodeBalance: vi.fn(),
}));

vi.mock('../../hooks/useNodes', () => ({
  useSendTip: mockUseSendTip,
  useNodeWallet: mockUseNodeWallet,
  useSpendableNodeBalance: mockUseSpendableNodeBalance,
}));

vi.mock('@cgraph-dev/shared-types/nodes', () => ({
  MIN_TIP: 10,
}));

vi.mock('@/shared/components/ui', async () => {
  const [button, dialog, input] = await Promise.all([
    vi.importActual<typeof import('@/components/ui/button')>('@/components/ui/button'),
    vi.importActual<typeof import('@/components/ui/dialog')>('@/components/ui/dialog'),
    vi.importActual<typeof import('@/components/ui/input')>('@/components/ui/input'),
  ]);
  return {
    ...button,
    ...dialog,
    ...input,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

import { TipModal } from '../tip-modal';
import { toast } from '@/shared/components/ui';
const makeDefaultProps = (overrides?: Record<string, unknown>) => ({
  recipientId: 'user-2',
  recipientName: 'alice',
  isOpen: true,
  onClose: vi.fn(),
  ...overrides,
});

const makeMutateFn = () => {
  const mutate = vi.fn();
  mockUseSendTip.mockReturnValue({ mutate, isPending: false });
  return mutate;
};

describe('TipModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNodeWallet.mockReturnValue({
      data: { available_balance: 5000 },
    });
    mockUseSpendableNodeBalance.mockImplementation(
      (wallet?: { available_balance?: number }) => wallet?.available_balance ?? 0
    );
    makeMutateFn();
  });
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<TipModal {...makeDefaultProps({ isOpen: false })} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal with recipient name in title', () => {
    render(<TipModal {...makeDefaultProps()} />);
    expect(screen.getByText('Tip @alice')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Tip @alice' })).toHaveAttribute(
      'data-cgraph-surface',
      'dialog'
    );
  });

  it('renders all preset amount buttons', () => {
    render(<TipModal {...makeDefaultProps()} />);

    // Preset buttons contain "ℕ {amount}" — use getAllByText since
    // the send button also contains the selected amount
    const buttons = screen.getAllByRole('button');
    const presetTexts = buttons.map((b) => b.textContent?.trim());
    expect(presetTexts).toContain('\u2115 10');
    expect(presetTexts).toContain('\u2115 50');
    expect(presetTexts).toContain('\u2115 100');
    expect(presetTexts).toContain('\u2115 500');
  });

  it('renders Cancel and Send buttons', () => {
    render(<TipModal {...makeDefaultProps()} />);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText(/Send/)).toBeInTheDocument();
  });

  it('displays creator receives calculation (80%)', () => {
    render(<TipModal {...makeDefaultProps()} />);

    expect(screen.getByText('Creator receives').parentElement).toHaveTextContent('\u2115 8 (80%)');
  });

  it('displays user balance', () => {
    render(<TipModal {...makeDefaultProps()} />);
    expect(screen.getByText('Your balance').parentElement).toHaveTextContent('\u2115 5,000');
  });

  it('uses spendable balance after local reservations', () => {
    mockUseNodeWallet.mockReturnValue({
      data: { available_balance: 100 },
    });
    mockUseSpendableNodeBalance.mockReturnValue(60);

    render(<TipModal {...makeDefaultProps()} />);

    fireEvent.click(screen.getByText(/100$/));

    expect(screen.getByText('Your balance').parentElement).toHaveTextContent('\u2115 60');
    expect(screen.getByRole('button', { name: /Send.*100/ })).toBeDisabled();
  });

  it('selects a preset amount when clicked', () => {
    render(<TipModal {...makeDefaultProps()} />);

    fireEvent.click(screen.getByText(/100$/));

    expect(screen.getByText('Creator receives').parentElement).toHaveTextContent(
      '\u2115 80 (80%)'
    );
    expect(screen.getByText(/Send.*100/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '\u2115 100' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
  it('shows custom input when Custom Amount is clicked', () => {
    render(<TipModal {...makeDefaultProps()} />);

    fireEvent.click(screen.getByText('Custom Amount'));

    expect(screen.getByPlaceholderText('Enter amount')).toHaveAttribute(
      'data-cgraph-surface',
      'field'
    );
  });

  it('updates amount via custom input', () => {
    render(<TipModal {...makeDefaultProps()} />);

    fireEvent.click(screen.getByText('Custom Amount'));
    fireEvent.change(screen.getByPlaceholderText('Enter amount'), {
      target: { value: '250' },
    });

    expect(screen.getByText('Creator receives').parentElement).toHaveTextContent(
      '\u2115 200 (80%)'
    );
  });

  it('resets to preset mode when a preset button is clicked after custom', () => {
    render(<TipModal {...makeDefaultProps()} />);

    fireEvent.click(screen.getByText('Custom Amount'));
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/50$/));

    // Custom input should be hidden
    expect(screen.queryByPlaceholderText('Enter amount')).not.toBeInTheDocument();
  });
  it('shows minimum tip warning when amount is below MIN_TIP', () => {
    render(<TipModal {...makeDefaultProps()} />);

    fireEvent.click(screen.getByText('Custom Amount'));
    fireEvent.change(screen.getByPlaceholderText('Enter amount'), {
      target: { value: '5' },
    });

    expect(screen.getByText(/Minimum tip is 10 Nodes/)).toBeInTheDocument();
  });

  it('disables send button when balance is insufficient', () => {
    mockUseNodeWallet.mockReturnValue({
      data: { available_balance: 30 },
    });

    render(<TipModal {...makeDefaultProps()} />);

    fireEvent.click(screen.getByText(/100$/));

    const sendButton = screen.getByRole('button', { name: /Send.*100/ });
    expect(sendButton).toBeDisabled();
    expect(screen.getByText(/insufficient/i)).toBeInTheDocument();
  });

  it('disables send button when amount is below minimum', () => {
    render(<TipModal {...makeDefaultProps()} />);

    fireEvent.click(screen.getByText('Custom Amount'));
    fireEvent.change(screen.getByPlaceholderText('Enter amount'), {
      target: { value: '3' },
    });

    const sendButton = screen.getByRole('button', { name: /Send/ });
    expect(sendButton).toBeDisabled();
  });
  it('calls mutate with recipientId and amount on send', () => {
    const mutate = makeMutateFn();
    render(<TipModal {...makeDefaultProps()} />);

    fireEvent.click(screen.getByText(/50$/));
    fireEvent.click(screen.getByRole('button', { name: /Send.*50/ }));

    expect(mutate).toHaveBeenCalledWith(
      { recipientId: 'user-2', amount: 50 },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('shows "Sending..." when mutation is pending', () => {
    mockUseSendTip.mockReturnValue({ mutate: vi.fn(), isPending: true });

    render(<TipModal {...makeDefaultProps()} />);

    expect(screen.getByText('Sending\u2026')).toBeInTheDocument();
  });

  it('disables send button when mutation is pending', () => {
    mockUseSendTip.mockReturnValue({ mutate: vi.fn(), isPending: true });

    render(<TipModal {...makeDefaultProps()} />);

    expect(screen.getByRole('button', { name: 'Sending\u2026' })).toBeDisabled();
  });

  it('calls onSuccess callback which triggers toast and onClose', () => {
    const mutate = vi.fn();
    mockUseSendTip.mockReturnValue({ mutate, isPending: false });
    const onClose = vi.fn();

    render(<TipModal {...makeDefaultProps({ onClose })} />);

    fireEvent.click(screen.getByRole('button', { name: /Send/ }));

    // Simulate onSuccess
    const { onSuccess } = mutate.mock.calls[0]![1];
    onSuccess();

    expect(onClose).toHaveBeenCalled();
  });

  it('shows rate-limit copy when the server throttles tipping', () => {
    const mutate = vi.fn();
    mockUseSendTip.mockReturnValue({ mutate, isPending: false });

    render(<TipModal {...makeDefaultProps()} />);
    fireEvent.click(screen.getByRole('button', { name: /Send/ }));

    const { onError } = mutate.mock.calls[0]![1];
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

  it('shows self-tip copy when the server rejects sending Nodes to yourself', () => {
    const mutate = vi.fn();
    mockUseSendTip.mockReturnValue({ mutate, isPending: false });

    render(<TipModal {...makeDefaultProps()} />);
    fireEvent.click(screen.getByRole('button', { name: /Send/ }));

    const { onError } = mutate.mock.calls[0]![1];
    onError({
      response: {
        data: {
          error: {
            code: 'self_tip',
            message: 'Cannot tip yourself',
          },
        },
      },
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Cannot send Nodes to yourself. Choose another recipient.'
    );
  });
  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();

    render(<TipModal {...makeDefaultProps({ onClose })} />);
    fireEvent.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalled();
  });
  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();

    render(<TipModal {...makeDefaultProps({ onClose })} />);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
  it('handles null wallet gracefully (balance defaults to 0)', () => {
    mockUseNodeWallet.mockReturnValue({ data: null });

    render(<TipModal {...makeDefaultProps()} />);

    expect(screen.getByText('Your balance').parentElement).toHaveTextContent('\u2115 0');
    const sendButton = screen.getByRole('button', { name: /Send/ });
    expect(sendButton).toBeDisabled();
  });

  it('handles non-numeric custom input gracefully', () => {
    render(<TipModal {...makeDefaultProps()} />);

    fireEvent.click(screen.getByText('Custom Amount'));
    fireEvent.change(screen.getByPlaceholderText('Enter amount'), {
      target: { value: 'abc' },
    });

    expect(screen.getByText('Creator receives').parentElement).toHaveTextContent('\u2115 0 (80%)');
  });
});
