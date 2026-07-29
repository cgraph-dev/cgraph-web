import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('@heroicons/react/24/outline', () => ({
  CurrencyDollarIcon: (props: Record<string, unknown>) => (
    <svg data-testid="CurrencyDollarIcon" {...props} />
  ),
  InformationCircleIcon: (props: Record<string, unknown>) => (
    <svg data-testid="InformationCircleIcon" {...props} />
  ),
}));

vi.mock('@/lib/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/logger')>();
  return {
    ...actual,
    createLogger: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
      time: vi.fn(),
      timeEnd: vi.fn(),
      breadcrumb: vi.fn(),
    }),
  };
});

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
    expect(document.querySelector('[data-cgraph-surface="card"]')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Toggle node gating' })).toHaveAttribute(
      'data-cgraph-surface',
      'control'
    );
  });

  it('renders the toggle in off state for non-gated group', () => {
    const group = createMockGroup({ is_node_gated: false });
    render(<NodeGatingSection group={group} isOwner={true} />);
    expect(screen.getByText('Require Node payment to join')).toBeInTheDocument();
    expect(screen.queryByLabelText('Payment frequency')).not.toBeInTheDocument();
  });

  it('shows gating options when toggle is enabled', () => {
    const group = createMockGroup({ is_node_gated: false });
    render(<NodeGatingSection group={group} isOwner={true} />);

    const toggle = screen.getByLabelText('Toggle node gating');
    fireEvent.click(toggle);

    const frequency = screen.getByLabelText('Payment frequency');
    expect(frequency).toHaveValue('monthly');
    expect(screen.getByRole('option', { name: 'Weekly' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Monthly' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Forever' })).toBeInTheDocument();
  });

  it('renders with existing gating settings', () => {
    const group = createMockGroup({
      is_node_gated: true,
      gate_type: 'monthly',
      gate_price_nodes: 50,
    });
    render(<NodeGatingSection group={group} isOwner={true} />);

    expect(screen.getByLabelText('Payment frequency')).toHaveValue('monthly');
    const priceInput = screen.getByLabelText('Gate price in nodes');
    expect(priceInput).toHaveValue(50);
    expect(priceInput).toHaveAttribute('min', '10');
  });

  it('shows the 80/20 revenue split info when enabled', () => {
    const group = createMockGroup({ is_node_gated: true, gate_price_nodes: 100 });
    render(<NodeGatingSection group={group} isOwner={true} />);

    expect(screen.getByText('Revenue split: 80/20')).toBeInTheDocument();
    expect(screen.getByText(/You receive 80%/)).toBeInTheDocument();
  });

  it('matches backend floor-cut math for non-divisible prices', () => {
    const group = createMockGroup({ is_node_gated: true, gate_price_nodes: 11 });
    render(<NodeGatingSection group={group} isOwner={true} />);

    expect(screen.getByText(/You receive 80% of each payment \(9 Nodes per member\)/)).toBeInTheDocument();
    expect(screen.getByText(/platform retains 20% \(2 Nodes\)/)).toBeInTheDocument();
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
    expect(priceInput).toHaveValue(10);
  });

  it('calls updateGroup with correct params when saving', async () => {
    const group = createMockGroup({
      is_node_gated: false,
    });
    render(<NodeGatingSection group={group} isOwner={true} />);

    fireEvent.click(screen.getByLabelText('Toggle node gating'));

    fireEvent.click(screen.getByRole('button', { name: 'Save gating settings' }));

    await waitFor(() => {
      expect(mockUpdateGroup).toHaveBeenCalledWith('g-1', {
        is_node_gated: true,
        gate_type: 'monthly',
        gate_price_nodes: 10,
      });
    });
  });

  it('locks controls while the update is pending', async () => {
    mockUpdateGroup.mockReturnValue(new Promise(() => {}));
    const group = createMockGroup({ is_node_gated: false });
    render(<NodeGatingSection group={group} isOwner={true} />);

    const toggle = screen.getByRole('switch', { name: 'Toggle node gating' });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: 'Save gating settings' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save gating settings' })).toHaveAttribute(
        'aria-busy',
        'true'
      );
      expect(toggle).toBeDisabled();
      expect(screen.getByLabelText('Payment frequency')).toBeDisabled();
      expect(screen.getByLabelText('Gate price in nodes')).toBeDisabled();
    });
  });

  it('shows error state when save fails', async () => {
    mockUpdateGroup.mockRejectedValue(new Error('Server error'));

    const group = createMockGroup({ is_node_gated: false });
    render(<NodeGatingSection group={group} isOwner={true} />);

    fireEvent.click(screen.getByLabelText('Toggle node gating'));

    fireEvent.click(screen.getByRole('button', { name: 'Save gating settings' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server error');
    });
  });

  it('allows selecting different gate types', () => {
    const group = createMockGroup({ is_node_gated: true, gate_type: 'monthly' });
    render(<NodeGatingSection group={group} isOwner={true} />);

    fireEvent.change(screen.getByLabelText('Payment frequency'), {
      target: { value: 'weekly' },
    });

    expect(screen.getByRole('button', { name: 'Save gating settings' })).toBeInTheDocument();
  });

  it('hides save button when there are no changes', () => {
    const group = createMockGroup({
      is_node_gated: true,
      gate_type: 'monthly',
      gate_price_nodes: 50,
    });
    render(<NodeGatingSection group={group} isOwner={true} />);

    expect(
      screen.queryByRole('button', { name: 'Save gating settings' })
    ).not.toBeInTheDocument();
  });
});
