import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { mockUseSendTip, mockUseNodeWallet } = vi.hoisted(() => ({
  mockUseSendTip: vi.fn(),
  mockUseNodeWallet: vi.fn(),
}));

vi.mock('../../hooks/useNodes', () => ({
  useSendTip: mockUseSendTip,
  useNodeWallet: mockUseNodeWallet,
}));

vi.mock('@cgraph-dev/shared-types/nodes', () => ({
  MIN_TIP: 10,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { TipButton } from '../tip-button';

const makeDefaultProps = (overrides?: Record<string, unknown>) => ({
  recipientId: 'user-2',
  recipientName: 'alice',
  ...overrides,
});

describe('TipButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSendTip.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockUseNodeWallet.mockReturnValue({
      data: { available_balance: 5000 },
    });
  });
  it('renders a button with tip text', () => {
    render(<TipButton {...makeDefaultProps()} />);
    expect(screen.getByText(/Tip/)).toBeInTheDocument();
  });

  it('has a title attribute with recipient name', () => {
    render(<TipButton {...makeDefaultProps()} />);
    expect(screen.getByTitle('Tip @alice')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<TipButton {...makeDefaultProps({ className: 'custom-class' })} />);
    const button = screen.getByTitle('Tip @alice');
    expect(button).toHaveClass('custom-class');
  });

  it('applies default className when no custom className', () => {
    render(<TipButton {...makeDefaultProps()} />);
    const button = screen.getByTitle('Tip @alice');
    expect(button).toHaveClass('text-purple-400');
  });
  it('does not show the tip modal initially', () => {
    render(<TipButton {...makeDefaultProps()} />);
    // TipModal renders null when isOpen is false
    expect(screen.queryByText('Tip @alice')).not.toBeInTheDocument();
  });

  it('shows the tip modal when button is clicked', () => {
    render(<TipButton {...makeDefaultProps()} />);

    fireEvent.click(screen.getByTitle('Tip @alice'));

    // TipModal should now be visible with the title
    expect(screen.getByText('Tip @alice')).toBeInTheDocument();
  });

  it('hides the tip modal when modal onClose is triggered', () => {
    render(<TipButton {...makeDefaultProps()} />);

    // Open modal
    fireEvent.click(screen.getByTitle('Tip @alice'));
    expect(screen.getByText('Tip @alice')).toBeInTheDocument();

    // Click Cancel in the modal
    fireEvent.click(screen.getByText('Cancel'));

    // Modal title should be gone
    expect(screen.queryByText('Tip @alice')).not.toBeInTheDocument();
  });

  it('passes recipientId and recipientName to TipModal', () => {
    render(<TipButton {...makeDefaultProps({ recipientName: 'bob' })} />);

    fireEvent.click(screen.getByTitle('Tip @bob'));

    // Modal should show the correct recipient
    expect(screen.getByText('Tip @bob')).toBeInTheDocument();
  });
});
