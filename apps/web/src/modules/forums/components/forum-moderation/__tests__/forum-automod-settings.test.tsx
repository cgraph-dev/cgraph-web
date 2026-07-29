import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const { mockGet, mockPut, mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPut: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    get: mockGet,
    put: mockPut,
  },
}));

vi.mock('@/shared/components/ui', async () => {
  const [alert, badge, button, card, input, skeleton, switchModule] = await Promise.all([
    vi.importActual<typeof import('@/components/ui/alert')>('@/components/ui/alert'),
    vi.importActual<typeof import('@/components/ui/badge')>('@/components/ui/badge'),
    vi.importActual<typeof import('@/components/ui/button')>('@/components/ui/button'),
    vi.importActual<typeof import('@/components/ui/card')>('@/components/ui/card'),
    vi.importActual<typeof import('@/components/ui/input')>('@/components/ui/input'),
    vi.importActual<typeof import('@/components/ui/skeleton')>('@/components/ui/skeleton'),
    vi.importActual<typeof import('@/components/ui/switch')>('@/components/ui/switch'),
  ]);
  return {
    ...alert,
    Badge: badge.default,
    ...button,
    Card: card.default,
    ...input,
    Skeleton: skeleton.default,
    ...switchModule,
    toast: {
      error: mockToastError,
      success: mockToastSuccess,
    },
  };
});

import ForumAutomodSettings from '../forum-automod-settings';

const rules = {
  word_filter: {
    enabled: true,
    banned_words: ['spam'],
    action: 'flag',
  },
  link_filter: {
    enabled: true,
    whitelist: [],
    blacklist: ['bad.example'],
    block_all_links: false,
    action: 'block',
  },
  spam_detection: {
    enabled: false,
    max_posts_per_minute: 3,
    max_duplicate_content: 2,
    action: 'block',
  },
  caps_filter: {
    enabled: false,
    max_caps_percentage: 70,
    min_length: 10,
    action: 'flag',
  },
};

describe('ForumAutomodSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: { data: rules } });
    mockPut.mockResolvedValue({ data: { data: rules } });
  });

  it('loads the forum rules and exposes real shared controls', async () => {
    render(<ForumAutomodSettings forumId="forum-1" />);

    expect(screen.getByRole('status', { name: 'Loading automod settings' })).toBeInTheDocument();
    expect(await screen.findByRole('switch', { name: 'Disable Word filter' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Disable Link filter' })).toBeChecked();
    expect(screen.getByText('spam')).toBeInTheDocument();
    expect(screen.getByText('bad.example')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Action')[0]).toHaveAttribute(
      'data-cgraph-material',
      'recessed'
    );
  });

  it('preserves declared defaults when the server returns a partial nested rule', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: {
          spam_detection: {
            enabled: true,
          },
        },
      },
    });
    render(<ForumAutomodSettings forumId="forum-partial" />);

    expect(
      await screen.findByRole('switch', { name: 'Disable Spam detection' })
    ).toBeChecked();
    expect(screen.getByLabelText('Maximum posts per minute')).toHaveValue(3);
    expect(screen.getByLabelText('Maximum duplicate posts')).toHaveValue(2);
    expect(screen.getByLabelText('Action')).toHaveValue('block');
  });

  it('normalizes and deduplicates words before saving the exact rules payload', async () => {
    render(<ForumAutomodSettings forumId="forum-2" />);
    await screen.findByText('spam');

    const wordInput = screen.getByPlaceholderText('Add banned word');
    fireEvent.change(wordInput, { target: { value: '  SCAM  ' } });
    fireEvent.keyDown(wordInput, { key: 'Enter' });
    expect(screen.getByText('scam')).toBeInTheDocument();

    fireEvent.change(wordInput, { target: { value: 'SCAM' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);
    expect(screen.getAllByText('scam')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Save Automod Rules' }));
    await waitFor(() =>
      expect(mockPut).toHaveBeenCalledWith('/api/v1/forums/forum-2/moderation/automod', {
        ...rules,
        word_filter: {
          ...rules.word_filter,
          banned_words: ['spam', 'scam'],
        },
      })
    );
    expect(mockToastSuccess).toHaveBeenCalledWith('Automod rules saved');
  });

  it('makes blacklisted domains visible and removable', async () => {
    render(<ForumAutomodSettings forumId="forum-3" />);
    await screen.findByText('bad.example');

    fireEvent.click(screen.getByRole('button', { name: 'Remove bad.example' }));
    expect(screen.queryByText('bad.example')).not.toBeInTheDocument();
    expect(screen.getByText('No blacklisted domains')).toBeInTheDocument();
  });

  it('toggles a disabled rule and persists its existing thresholds', async () => {
    render(<ForumAutomodSettings forumId="forum-4" />);
    const spamSwitch = await screen.findByRole('switch', { name: 'Enable Spam detection' });

    fireEvent.click(spamSwitch);
    expect(screen.getByRole('switch', { name: 'Disable Spam detection' })).toBeChecked();
    expect(screen.getByLabelText('Maximum posts per minute')).toHaveValue(3);
    expect(screen.getByLabelText('Maximum duplicate posts')).toHaveValue(2);
  });

  it('shows a visible load failure and retries the same endpoint', async () => {
    mockGet.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({
      data: { data: rules },
    });
    render(<ForumAutomodSettings forumId="forum-5" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Automod settings unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('spam')).toBeInTheDocument();
    expect(mockGet).toHaveBeenNthCalledWith(
      2,
      '/api/v1/forums/forum-5/moderation/automod'
    );
  });

  it('reports save failures and leaves the edited rules mounted', async () => {
    mockPut.mockRejectedValue(new Error('denied'));
    render(<ForumAutomodSettings forumId="forum-6" />);
    await screen.findByText('spam');

    fireEvent.click(screen.getByRole('button', { name: 'Save Automod Rules' }));
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('Failed to save automod rules')
    );
    expect(screen.getByText('spam')).toBeInTheDocument();
  });
});
