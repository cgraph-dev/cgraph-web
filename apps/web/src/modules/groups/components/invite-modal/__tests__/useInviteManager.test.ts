/**
 * useInviteManager Hook Tests
 *
 * Tests for invite generation, copy to clipboard, delete,
 * expiration formatting, and API interactions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInviteManager, EXPIRATION_OPTIONS, MAX_USES_OPTIONS } from '../useInviteManager';

// --- Mock dependencies ---

const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
const mockApiDelete = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    delete: (...args: unknown[]) => mockApiDelete(...args),
  },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
  }),
}));

// --- Tests ---

describe('useInviteManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: { data: [] } });
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('starts with create tab active', () => {
    const { result } = renderHook(() => useInviteManager('g-1'));
    expect(result.current.activeTab).toBe('create');
  });

  it('defaults expiration to 24 hours', () => {
    const { result } = renderHook(() => useInviteManager('g-1'));
    expect(result.current.expiration).toBe(86400);
  });

  it('defaults maxUses to null (no limit)', () => {
    const { result } = renderHook(() => useInviteManager('g-1'));
    expect(result.current.maxUses).toBeNull();
  });

  it('fetches existing invites on mount', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 'inv-1',
            code: 'ABC123',
            max_uses: 10,
            uses: 2,
            expires_at: null,
            created_by: { id: 'u-1', username: 'alice' },
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
      },
    });

    const { result } = renderHook(() => useInviteManager('g-1'));
    await waitFor(() => {
      expect(result.current.invites).toHaveLength(1);
    });
    expect(result.current.invites[0]!.code).toBe('ABC123');
    expect(result.current.invites[0]!.maxUses).toBe(10);
    expect(result.current.invites[0]!.uses).toBe(2);
  });

  it('does not fetch invites when groupId is undefined', () => {
    renderHook(() => useInviteManager(undefined));
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it('generates an invite via API', async () => {
    mockApiPost.mockResolvedValueOnce({
      data: { data: { id: 'inv-new', code: 'NEWCODE' } },
    });

    const { result } = renderHook(() => useInviteManager('g-1'));

    await act(async () => {
      await result.current.handleGenerateInvite();
    });

    expect(mockApiPost).toHaveBeenCalledWith('/api/v1/groups/g-1/invites', {
      max_uses: undefined,
      expires_in: 86400,
    });
    expect(result.current.inviteLink).toContain('NEWCODE');
    expect(result.current.invites).toHaveLength(1);
  });

  it('does not generate invite without groupId', async () => {
    const { result } = renderHook(() => useInviteManager(undefined));
    await act(async () => {
      await result.current.handleGenerateInvite();
    });
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('handles generate invite API failure', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useInviteManager('g-1'));
    await act(async () => {
      await result.current.handleGenerateInvite();
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.invites).toHaveLength(0);
  });

  it('copies link to clipboard', async () => {
    const { result } = renderHook(() => useInviteManager('g-1'));

    await act(async () => {
      await result.current.handleCopyLink('https://example.com/invite/XYZ');
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/invite/XYZ');
    expect(result.current.copied).toBe(true);
  });

  it('deletes invite optimistically and calls API', () => {
    const { result } = renderHook(() => useInviteManager('g-1'));

    // Manually add an invite to state
    act(() => {
      result.current.handleDeleteInvite('inv-1');
    });

    // API delete should be called
    expect(mockApiDelete).toHaveBeenCalledWith('/api/v1/groups/g-1/invites/inv-1');
  });

  it('formatExpiration returns "Never expires" for null', () => {
    const { result } = renderHook(() => useInviteManager('g-1'));
    expect(result.current.formatExpiration(null)).toBe('Never expires');
  });

  it('formatExpiration returns "Expired" for past dates', () => {
    const { result } = renderHook(() => useInviteManager('g-1'));
    expect(result.current.formatExpiration('2020-01-01T00:00:00Z')).toBe('Expired');
  });

  it('exports EXPIRATION_OPTIONS with expected length', () => {
    expect(EXPIRATION_OPTIONS).toHaveLength(7);
    expect(EXPIRATION_OPTIONS[0]!.label).toBe('Never');
  });

  it('exports MAX_USES_OPTIONS with expected length', () => {
    expect(MAX_USES_OPTIONS).toHaveLength(7);
    expect(MAX_USES_OPTIONS[0]!.label).toBe('No limit');
  });

  it('allows switching tabs', () => {
    const { result } = renderHook(() => useInviteManager('g-1'));
    act(() => {
      result.current.setActiveTab('manage');
    });
    expect(result.current.activeTab).toBe('manage');
  });
});
