import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/api-client';
import { AutomodTab } from '../automod-tab';

vi.mock('@/lib/api-client', () => ({
  http: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/lib/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/logger')>();
  return {
    ...actual,
    createLogger: (name: string) => ({
      ...actual.createLogger(name),
      error: vi.fn(),
    }),
  };
});

const rule = {
  id: 'rule-1',
  name: 'No invite links',
  rule_type: 'link_filter',
  action: 'delete',
  enabled: true,
  pattern: 'invite.example',
  config: null,
  inserted_at: '2026-01-01T00:00:00.000Z',
} as const;

describe('AutomodTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(http.get).mockResolvedValue({ data: { data: [rule] } });
    vi.mocked(http.patch).mockResolvedValue({
      data: { data: { ...rule, enabled: false } },
    });
    vi.mocked(http.delete).mockResolvedValue({ data: {} });
  });

  it('loads rules and persists enabled state through the existing toggle endpoint', async () => {
    render(<AutomodTab groupId="group-1" />);

    expect(await screen.findByText('No invite links')).toBeInTheDocument();
    const toggle = screen.getByRole('switch', { name: 'Disable No invite links' });
    expect(toggle).toBeChecked();

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(http.patch).toHaveBeenCalledWith(
        '/api/v1/groups/group-1/automod/rules/rule-1/toggle'
      );
    });
    expect(
      screen.getByRole('switch', { name: 'Enable No invite links' })
    ).not.toBeChecked();
  });

  it('validates and creates a rule with the supported API payload', async () => {
    const createdRule = {
      ...rule,
      id: 'rule-2',
      name: 'Review links',
      action: 'warn',
      enabled: false,
    } as const;
    vi.mocked(http.post).mockResolvedValue({ data: { data: createdRule } });

    render(<AutomodTab groupId="group-1" />);
    await screen.findByText('No invite links');
    fireEvent.click(screen.getByRole('button', { name: 'Add Rule' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Rule' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required.');

    fireEvent.change(screen.getByRole('textbox', { name: 'Rule name' }), {
      target: { value: 'Review links' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'Link Filter' }));
    fireEvent.change(screen.getByRole('textbox', { name: /Pattern \/ Config/ }), {
      target: { value: 'links.example' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'Warn User' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Rule' }));

    await waitFor(() => {
      expect(http.post).toHaveBeenCalledWith('/api/v1/groups/group-1/automod/rules', {
        name: 'Review links',
        rule_type: 'link_filter',
        action: 'warn',
        pattern: 'links.example',
      });
    });
    expect(await screen.findByText('Review links')).toBeInTheDocument();
  });

  it('requires explicit confirmation before deleting a rule', async () => {
    render(<AutomodTab groupId="group-1" />);
    await screen.findByText('No invite links');

    fireEvent.click(screen.getByRole('button', { name: 'Delete No invite links' }));

    expect(http.delete).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Delete AutoMod rule' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete rule' }));

    await waitFor(() => {
      expect(http.delete).toHaveBeenCalledWith(
        '/api/v1/groups/group-1/automod/rules/rule-1'
      );
    });
    expect(screen.queryByText('No invite links')).not.toBeInTheDocument();
  });
});
