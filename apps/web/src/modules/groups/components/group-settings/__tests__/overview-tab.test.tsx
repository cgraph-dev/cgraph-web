import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Group } from '@/modules/groups/store';
import { OverviewTab } from '../overview-tab';

vi.mock('../node-gating-section', () => ({
  NodeGatingSection: () => <div data-testid="node-gating-section" />,
}));

vi.mock('@/modules/groups/store', () => ({
  useGroupStore: vi.fn(() => vi.fn()),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    post: vi.fn(),
  },
}));

vi.mock('@/lib/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/logger')>();
  return {
    ...actual,
    createLogger: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      time: vi.fn(),
      timeEnd: vi.fn(),
      breadcrumb: vi.fn(),
    }),
  };
});

const group = {
  id: 'group-overview',
  name: 'Design Systems',
  slug: 'design-systems',
  description: 'A focused group.',
  iconUrl: null,
  bannerUrl: null,
  isPublic: false,
  memberCount: 12,
  onlineMemberCount: 4,
  ownerId: 'owner-1',
  categories: [],
  channels: [],
  roles: [],
  myMember: null,
  createdAt: '2026-01-01T00:00:00Z',
  is_node_gated: false,
  gate_type: null,
  gate_price_nodes: null,
} satisfies Group;

describe('OverviewTab', () => {
  it('uses canonical controls and exact backend field limits', () => {
    render(
      <OverviewTab
        group={group}
        formData={{ name: group.name, description: group.description, isPublic: false }}
        onChange={vi.fn()}
        isAdmin
      />
    );

    const name = screen.getByRole('textbox', { name: /^Group name/ });
    const description = screen.getByRole('textbox', { name: 'Description' });
    const visibility = screen.getByRole('switch', { name: 'Public group' });

    expect(name).toHaveAttribute('minlength', '2');
    expect(name).toHaveAttribute('maxlength', '100');
    expect(description).toHaveAttribute('maxlength', '1000');
    expect(visibility).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: 'Change banner' })).toHaveAttribute(
      'data-cgraph-surface',
      'control'
    );
    expect(screen.getByRole('button', { name: 'Upload icon' })).toHaveAttribute(
      'data-cgraph-surface',
      'control'
    );
  });

  it('reports field and visibility changes through the form owner', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <OverviewTab
        group={group}
        formData={{ name: group.name, description: group.description, isPublic: false }}
        onChange={onChange}
        isAdmin
      />
    );

    fireEvent.change(screen.getByRole('textbox', { name: /^Group name/ }), {
      target: { value: `${group.name} Lab` },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: `${group.name} Lab` })
    );

    await user.click(screen.getByRole('switch', { name: 'Public group' }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: group.name, isPublic: true })
    );
  });

  it('shows local name validation without sending a save request', () => {
    render(
      <OverviewTab
        group={group}
        formData={{ name: 'A', description: '', isPublic: false }}
        onChange={vi.fn()}
        isAdmin
      />
    );

    expect(screen.getByRole('textbox', { name: /^Group name/ })).toHaveAccessibleDescription(
      'Group name must be at least 2 characters.'
    );
  });

  it('does not render media actions for a non-manager', () => {
    render(
      <OverviewTab
        group={group}
        formData={{ name: group.name, description: group.description, isPublic: false }}
        onChange={vi.fn()}
        isAdmin={false}
      />
    );

    expect(screen.queryByRole('button', { name: 'Change banner' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upload icon' })).not.toBeInTheDocument();
  });
});
