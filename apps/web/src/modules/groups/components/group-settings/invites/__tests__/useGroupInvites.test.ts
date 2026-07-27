import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  copyInviteUrl,
  getInviteStatus,
  normalizeGroupInvite,
  useGroupInvites,
} from '../useGroupInvites';

const getInvites = vi.fn();
const createInvite = vi.fn();
const deleteInvite = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    groups: {
      getInvites: (...args: unknown[]) => getInvites(...args),
      createInvite: (...args: unknown[]) => createInvite(...args),
      deleteInvite: (...args: unknown[]) => deleteInvite(...args),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

function serverInvite(overrides: Record<string, unknown> = {}) {
  return {
    id: 'invite-1',
    code: 'CGRAPH01',
    uses: 2,
    max_uses: 10,
    expires_at: null,
    created_at: '2026-07-20T00:00:00.000Z',
    revoked: false,
    inviter: {
      id: 'user-1',
      username: 'alice',
      display_name: 'Alice A',
    },
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('useGroupInvites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInvites.mockResolvedValue({ ok: true, data: [] });
    createInvite.mockResolvedValue({ ok: true, data: serverInvite() });
    deleteInvite.mockResolvedValue({ ok: true, data: { ok: true } });
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('normalizes the exact backend inviter and lifecycle fields', () => {
    const invite = normalizeGroupInvite(serverInvite());

    expect(invite).toMatchObject({
      id: 'invite-1',
      code: 'CGRAPH01',
      uses: 2,
      maxUses: 10,
      expiresAt: null,
      createdAt: '2026-07-20T00:00:00.000Z',
      inviter: {
        id: 'user-1',
        username: 'alice',
        displayName: 'Alice A',
      },
    });
    expect(invite.url).toContain('/invite/CGRAPH01');
  });

  it('does not invent creator or timestamp data when the server omits it', () => {
    const invite = normalizeGroupInvite(
      serverInvite({ inviter: undefined, created_at: undefined, uses: undefined })
    );

    expect(invite.inviter).toBeNull();
    expect(invite.createdAt).toBeNull();
    expect(invite.uses).toBeNull();
  });

  it('orders active links before unavailable links and newest links first', async () => {
    getInvites.mockResolvedValue({
      ok: true,
      data: [
        serverInvite({
          id: 'expired',
          code: 'EXPIRED',
          expires_at: '2020-01-01T00:00:00.000Z',
          created_at: '2026-07-27T00:00:00.000Z',
        }),
        serverInvite({
          id: 'older',
          code: 'OLDER',
          created_at: '2026-07-20T00:00:00.000Z',
        }),
        serverInvite({
          id: 'newer',
          code: 'NEWER',
          created_at: '2026-07-26T00:00:00.000Z',
        }),
      ],
    });

    const { result } = renderHook(() => useGroupInvites('group-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.invites.map((invite) => invite.id)).toEqual([
      'newer',
      'older',
      'expired',
    ]);
  });

  it('ignores a stale list response after the group changes', async () => {
    const first = deferred<{ ok: true; data: ReturnType<typeof serverInvite>[] }>();
    const second = deferred<{ ok: true; data: ReturnType<typeof serverInvite>[] }>();
    getInvites.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result, rerender } = renderHook(
      ({ groupId }) => useGroupInvites(groupId),
      { initialProps: { groupId: 'group-1' } }
    );
    rerender({ groupId: 'group-2' });

    await act(async () => {
      second.resolve({ ok: true, data: [serverInvite({ id: 'second', code: 'SECOND' })] });
    });
    await waitFor(() => expect(result.current.invites[0]?.id).toBe('second'));

    await act(async () => {
      first.resolve({ ok: true, data: [serverInvite({ id: 'first', code: 'FIRST' })] });
    });
    expect(result.current.invites[0]?.id).toBe('second');
  });

  it('creates from a local draft and keeps server lifecycle truth', async () => {
    createInvite.mockResolvedValue({
      ok: true,
      data: serverInvite({
        id: 'created',
        code: 'CREATED',
        max_uses: 50,
        expires_at: null,
      }),
    });
    const { result } = renderHook(() => useGroupInvites('group-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let operation;
    await act(async () => {
      operation = await result.current.createInvite({
        expirationSeconds: 604800,
        maxUses: 10,
      });
    });

    expect(createInvite).toHaveBeenCalledWith('group-1', {
      expires_in: 604800,
      max_uses: 10,
    });
    expect(operation).toMatchObject({
      ok: true,
      data: { id: 'created', maxUses: 50, expiresAt: null },
    });
    expect(result.current.invites[0]).toMatchObject({
      id: 'created',
      maxUses: 50,
      expiresAt: null,
    });
  });

  it('serializes duplicate create submissions', async () => {
    const pending = deferred<{ ok: true; data: ReturnType<typeof serverInvite> }>();
    createInvite.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useGroupInvites('group-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let first!: Promise<unknown>;
    let second!: Promise<unknown>;
    act(() => {
      first = result.current.createInvite({ expirationSeconds: null, maxUses: null });
      second = result.current.createInvite({ expirationSeconds: null, maxUses: null });
    });

    await expect(second).resolves.toEqual({
      ok: false,
      error: 'An invite link is already being created.',
    });
    expect(createInvite).toHaveBeenCalledOnce();

    await act(async () => {
      pending.resolve({ ok: true, data: serverInvite() });
      await first;
    });
  });

  it('keeps an invite until delete succeeds', async () => {
    getInvites.mockResolvedValue({ ok: true, data: [serverInvite()] });
    deleteInvite
      .mockResolvedValueOnce({ ok: false, error: { message: 'Forbidden', status: 403 } })
      .mockResolvedValueOnce({ ok: true, data: { ok: true } });
    const { result } = renderHook(() => useGroupInvites('group-1'));
    await waitFor(() => expect(result.current.invites).toHaveLength(1));

    await act(async () => {
      const failed = await result.current.deleteInvite('invite-1');
      expect(failed).toMatchObject({ ok: false });
    });
    expect(result.current.invites).toHaveLength(1);

    await act(async () => {
      const succeeded = await result.current.deleteInvite('invite-1');
      expect(succeeded).toEqual({ ok: true, data: undefined });
    });
    expect(result.current.invites).toHaveLength(0);
  });

  it('classifies revoked, expired, exhausted, and active links', () => {
    const base = normalizeGroupInvite(serverInvite());
    expect(getInviteStatus(base).kind).toBe('active');
    expect(getInviteStatus({ ...base, revoked: true }).kind).toBe('revoked');
    expect(
      getInviteStatus({ ...base, expiresAt: '2020-01-01T00:00:00.000Z' }).kind
    ).toBe('expired');
    expect(getInviteStatus({ ...base, uses: 10, maxUses: 10 }).kind).toBe('limit-reached');
  });

  it('reports clipboard failure instead of claiming success', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'));
    await expect(copyInviteUrl('https://web.cgraph.org/invite/CGRAPH01')).resolves.toEqual({
      ok: false,
      error: 'Could not copy the invite link.',
    });
  });
});
