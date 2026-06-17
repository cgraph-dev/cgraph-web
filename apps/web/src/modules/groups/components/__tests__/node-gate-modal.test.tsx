/**
 * NodeGateModal Component Tests
 *
 * Tests for the node-gated group join modal.
 * Covers: rendering states, group info display, payment flow,
 * error handling, gate type display, and user interactions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// --- Mocks ---

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      onClick,
      className,
      animate: _animate,
      exit: _exit,
      initial: _initial,
      transition: _transition,
      variants: _variants,
      whileHover: _whileHover,
      whileTap: _whileTap,
      layout: _layout,
      layoutId: _layoutId,
      ...rest
    }: Record<string, unknown> & {
      children?: React.ReactNode;
      onClick?: (e: unknown) => void;
      className?: string;
    }) => (
      <div onClick={onClick} className={className} {...rest}>
        {children}
      </div>
    ),
    button: ({
      children,
      onClick,
      disabled,
      className,
      animate: _animate,
      exit: _exit,
      initial: _initial,
      transition: _transition,
      variants: _variants,
      whileHover: _whileHover,
      whileTap: _whileTap,
      layout: _layout,
      layoutId: _layoutId,
      ...rest
    }: Record<string, unknown> & {
      children?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      className?: string;
    }) => (
      <button onClick={onClick} disabled={disabled} className={className} {...rest}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  LockClosedIcon: (props: Record<string, unknown>) => (
    <svg data-testid="LockClosedIcon" {...props} />
  ),
  CurrencyDollarIcon: (props: Record<string, unknown>) => (
    <svg data-testid="CurrencyDollarIcon" {...props} />
  ),
}));

vi.mock('@/lib/animations/transitions', () => ({
  FADE_IN: { initial: { opacity: 0 }, animate: { opacity: 1 } },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
  }),
}));

const mockSubscribeToGroup = vi.fn();
vi.mock('@/modules/groups/services/group-subscription-api', () => ({
  subscribeToGroup: (...args: unknown[]) => mockSubscribeToGroup(...args),
}));

import { NodeGateModal } from '../node-gate-modal';
import type { Group } from '@/modules/groups/store/group-types';

// --- Helpers ---

function createMockGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 'g-1',
    name: 'Premium Group',
    slug: 'premium-group',
    description: 'An exclusive community',
    iconUrl: null,
    bannerUrl: null,
    isPublic: true,
    memberCount: 100,
    onlineMemberCount: 25,
    ownerId: 'u-owner',
    categories: [],
    channels: [],
    roles: [],
    myMember: null,
    createdAt: '2026-01-01T00:00:00Z',
    is_node_gated: true,
    gate_type: 'monthly',
    gate_price_nodes: 50,
    ...overrides,
  };
}

// --- Tests ---

describe('NodeGateModal', () => {
  function createDefaultProps() {
    return {
      group: createMockGroup(),
      onSuccess: vi.fn(),
      onClose: vi.fn(),
    };
  }

  let defaultProps: ReturnType<typeof createDefaultProps>;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps = createDefaultProps();
    mockSubscribeToGroup.mockResolvedValue({ id: 'sub-1', status: 'active' });
  });

  it('renders group name and description', () => {
    render(<NodeGateModal {...defaultProps} />);
    expect(screen.getByText('Premium Group')).toBeInTheDocument();
    expect(screen.getByText('An exclusive community')).toBeInTheDocument();
  });

  it('displays the node payment requirement message', () => {
    render(<NodeGateModal {...defaultProps} />);
    expect(screen.getByText('This group requires a Node payment to join')).toBeInTheDocument();
  });

  it('shows the correct price', () => {
    render(<NodeGateModal {...defaultProps} />);
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Nodes')).toBeInTheDocument();
  });

  it('shows the gate type badge', () => {
    render(<NodeGateModal {...defaultProps} />);
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('shows recurring info for monthly gate type', () => {
    render(<NodeGateModal {...defaultProps} />);
    expect(screen.getByText(/Recurring — auto-renews/)).toBeInTheDocument();
  });

  it('shows one-time payment info for forever gate type', () => {
    const group = createMockGroup({ gate_type: 'forever' });
    render(<NodeGateModal {...defaultProps} group={group} />);
    expect(screen.getByText(/One-time payment/)).toBeInTheDocument();
  });

  it('renders Pay & Join and Cancel buttons', () => {
    render(<NodeGateModal {...defaultProps} />);
    expect(screen.getByText('Pay & Join')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<NodeGateModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<NodeGateModal {...defaultProps} />);
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls subscribeToGroup and onSuccess on successful payment', async () => {
    render(<NodeGateModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Pay & Join'));

    await waitFor(() => {
      expect(mockSubscribeToGroup).toHaveBeenCalledWith('g-1');
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('shows loading state during payment', async () => {
    let resolveSubscription: (value: { id: string; status: string }) => void = () => {};
    mockSubscribeToGroup.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubscription = resolve;
        })
    );

    render(<NodeGateModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Pay & Join'));

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    resolveSubscription({ id: 'sub-1', status: 'active' });
    await waitFor(() => {
      expect(screen.getByText('Pay & Join')).toBeInTheDocument();
    });
  });

  it('shows insufficient nodes error', async () => {
    mockSubscribeToGroup.mockRejectedValue(new Error('insufficient nodes'));
    render(<NodeGateModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Pay & Join'));

    await waitFor(() => {
      expect(screen.getByText(/Insufficient Nodes/)).toBeInTheDocument();
    });
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });

  it('shows generic error for other failures', async () => {
    mockSubscribeToGroup.mockRejectedValue(new Error('Network timeout'));
    render(<NodeGateModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Pay & Join'));

    await waitFor(() => {
      expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });
  });

  it('renders group icon initials when no iconUrl', () => {
    render(<NodeGateModal {...defaultProps} />);
    expect(screen.getByText('PR')).toBeInTheDocument();
  });

  it('renders group icon image when iconUrl is provided', () => {
    const group = createMockGroup({ iconUrl: 'https://example.com/icon.png' });
    render(<NodeGateModal {...defaultProps} group={group} />);
    const img = screen.getByAltText('Premium Group');
    expect(img).toHaveAttribute('src', 'https://example.com/icon.png');
  });

  it('shows Weekly badge for weekly gate type', () => {
    const group = createMockGroup({ gate_type: 'weekly' });
    render(<NodeGateModal {...defaultProps} group={group} />);
    expect(screen.getByText('Weekly')).toBeInTheDocument();
  });
});
