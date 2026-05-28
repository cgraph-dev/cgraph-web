/**
 * NodeGatingSection Component Tests
 *
 * Tests for the node-gating configuration section in group settings.
 * Covers: rendering, toggle behavior, gate type selection, price input,
 * save flow, error handling, and owner-only visibility.
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
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...rest
    }: Record<string, unknown> & {
      children?: React.ReactNode;
      onClick?: (e: unknown) => void;
      className?: string;
      whileHover?: unknown;
      whileTap?: unknown;
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
      'aria-label': ariaLabel,
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...rest
    }: Record<string, unknown> & {
      children?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      className?: string;
      'aria-label'?: string;
      whileHover?: unknown;
      whileTap?: unknown;
    }) => (
      <button
        onClick={onClick}
        disabled={disabled}
        className={className}
        aria-label={ariaLabel}
        {...rest}
      >
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  CurrencyDollarIcon: (props: Record<string, unknown>) => (
    <svg data-testid="CurrencyDollarIcon" {...props} />
  ),
  InformationCircleIcon: (props: Record<string, unknown>) => (
    <svg data-testid="InformationCircleIcon" {...props} />
  ),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
  }),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const mockUpdateGroup = vi.fn();
vi.mock('@/modules/groups/store', () => ({
  useGroupStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = { updateGroup: mockUpdateGroup };
    return selector ? selector(state) : state;
  }),
}));

import { NodeGatingSection } from '../node-gating-section';
import type { Group } from '@/modules/groups/store/group-types';

// --- Helpers ---

function createMockGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 'g-1',
    name: 'Test Group',
    slug: 'test-group',
    description: null,
    iconUrl: null,
    bannerUrl: null,
    isPublic: true,
    memberCount: 10,
    onlineMemberCount: 5,
    ownerId: 'u-1',
    categories: [],
    channels: [],
    roles: [],
    myMember: null,
    createdAt: '2026-01-01T00:00:00Z',
    is_node_gated: false,
    gate_type: null,
    gate_price_nodes: null,
    ...overrides,
  };
}

// --- Tests ---

describe('NodeGatingSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateGroup.mockResolvedValue({});
  });

  it('renders nothing when user is not the owner', () => {
    const group = createMockGroup();
    const { container } = render(<NodeGatingSection group={group} isOwner={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the section header when user is owner', () => {
    const group = createMockGroup();
    render(<NodeGatingSection group={group} isOwner={true} />);
    expect(screen.getByText('Node-Gated Access')).toBeInTheDocument();
  });

  it('renders the toggle in off state for non-gated group', () => {
    const group = createMockGroup({ is_node_gated: false });
    render(<NodeGatingSection group={group} isOwner={true} />);
    expect(screen.getByText('Require Node Payment to Join')).toBeInTheDocument();
    // Gate type options should not be visible
    expect(screen.queryByText('Payment Frequency')).not.toBeInTheDocument();
  });

  it('shows gating options when toggle is enabled', () => {
    const group = createMockGroup({ is_node_gated: false });
    render(<NodeGatingSection group={group} isOwner={true} />);

    // Click the toggle
    const toggle = screen.getByLabelText('Toggle node gating');
    fireEvent.click(toggle);

    // Options should now be visible
    expect(screen.getByText('Payment Frequency')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Forever')).toBeInTheDocument();
  });

  it('renders with existing gating settings', () => {
    const group = createMockGroup({
      is_node_gated: true,
      gate_type: 'monthly',
      gate_price_nodes: 50,
    });
    render(<NodeGatingSection group={group} isOwner={true} />);

    expect(screen.getByText('Payment Frequency')).toBeInTheDocument();
    const priceInput = screen.getByLabelText('Gate price in nodes');
    expect(priceInput).toHaveValue(50);
  });

  it('shows the 80/20 revenue split info when enabled', () => {
    const group = createMockGroup({ is_node_gated: true, gate_price_nodes: 100 });
    render(<NodeGatingSection group={group} isOwner={true} />);

    expect(screen.getByText('Revenue Split: 80/20')).toBeInTheDocument();
    expect(screen.getByText(/You receive 80%/)).toBeInTheDocument();
  });

  it('updates price input and enforces minimum', () => {
    const group = createMockGroup({
      is_node_gated: true,
      gate_type: 'monthly',
      gate_price_nodes: 50,
    });
    render(<NodeGatingSection group={group} isOwner={true} />);

    const priceInput = screen.getByLabelText('Gate price in nodes');
    fireEvent.change(priceInput, { target: { value: '5' } });
    // Should set to minimum (10)
    expect(priceInput).toHaveValue(10);
  });

  it('calls updateGroup with correct params when saving', async () => {
    const group = createMockGroup({
      is_node_gated: false,
    });
    render(<NodeGatingSection group={group} isOwner={true} />);

    // Enable gating
    fireEvent.click(screen.getByLabelText('Toggle node gating'));

    // Click save
    fireEvent.click(screen.getByText('Save Gating Settings'));

    await waitFor(() => {
      expect(mockUpdateGroup).toHaveBeenCalledWith('g-1', {
        is_node_gated: true,
        gate_type: 'monthly',
        gate_price_nodes: 10,
      });
    });
  });

  it('shows error state when save fails', async () => {
    mockUpdateGroup.mockRejectedValue(new Error('Server error'));

    const group = createMockGroup({ is_node_gated: false });
    render(<NodeGatingSection group={group} isOwner={true} />);

    // Enable gating
    fireEvent.click(screen.getByLabelText('Toggle node gating'));

    // Click save
    fireEvent.click(screen.getByText('Save Gating Settings'));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('allows selecting different gate types', () => {
    const group = createMockGroup({ is_node_gated: true, gate_type: 'monthly' });
    render(<NodeGatingSection group={group} isOwner={true} />);

    fireEvent.click(screen.getByText('Weekly'));

    // Save button should appear since there is a change
    expect(screen.getByText('Save Gating Settings')).toBeInTheDocument();
  });

  it('hides save button when there are no changes', () => {
    const group = createMockGroup({
      is_node_gated: true,
      gate_type: 'monthly',
      gate_price_nodes: 50,
    });
    render(<NodeGatingSection group={group} isOwner={true} />);

    // No changes made, so save button should not be visible
    expect(screen.queryByText('Save Gating Settings')).not.toBeInTheDocument();
  });
});
