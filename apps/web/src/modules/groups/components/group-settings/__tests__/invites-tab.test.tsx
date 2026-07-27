import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { GroupInviteView } from '../invites/types';

const mockCreateInvite = vi.fn();
const mockDeleteInvite = vi.fn();
const mockReload = vi.fn();
const mockUseGroupInvites = vi.fn();

vi.mock('../invites/useGroupInvites', async (importOriginal) => {
  const original = await importOriginal<typeof import('../invites/useGroupInvites')>();
  return {
    ...original,
    useGroupInvites: (...args: unknown[]) => mockUseGroupInvites(...args),
  };
});

import { InvitesTab } from '../invites-tab';

const invite: GroupInviteView = {
  id: 'invite-1',
  code: 'CGRAPH01',
  url: 'https://web.cgraph.org/invite/CGRAPH01',
  uses: 2,
  maxUses: 10,
  expiresAt: null,
  createdAt: '2026-07-20T00:00:00.000Z',
  revoked: false,
  inviter: {
    id: 'user-1',
    username: 'alice',
    displayName: 'Alice',
  },
};

function renderTab({
  canCreateInvites = true,
  canDeleteInvites = true,
}: {
  canCreateInvites?: boolean;
  canDeleteInvites?: boolean;
} = {}) {
  return render(
    <InvitesTab
      groupId="group-1"
      groupName="Design team"
      canCreateInvites={canCreateInvites}
      canDeleteInvites={canDeleteInvites}
    />
  );
}

describe('InvitesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateInvite.mockResolvedValue({ ok: true, data: invite });
    mockDeleteInvite.mockResolvedValue({ ok: true, data: undefined });
    mockUseGroupInvites.mockReturnValue({
      invites: [invite],
      isLoading: false,
      loadError: null,
      isCreating: false,
      deletingInviteId: null,
      reload: mockReload,
      createInvite: mockCreateInvite,
      deleteInvite: mockDeleteInvite,
    });
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders exact invite lifecycle and inviter data', () => {
    renderTab();

    const row = screen.getByTestId('invite-row-CGRAPH01');
    expect(row).toHaveTextContent('CGRAPH01');
    expect(row).toHaveTextContent('2 / 10 uses');
    expect(row).toHaveTextContent('Never expires');
    expect(row).toHaveTextContent('Created by Alice');
  });

  it('renders the canonical loading skeleton', () => {
    mockUseGroupInvites.mockReturnValue({
      ...mockUseGroupInvites(),
      invites: [],
      isLoading: true,
    });

    renderTab();

    expect(screen.getByRole('status', { name: 'Loading invite links' })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-cgraph-skeleton="true"]')).toHaveLength(6);
  });

  it('gates creation and deletion independently', () => {
    renderTab({ canCreateInvites: false, canDeleteInvites: false });

    expect(screen.queryByRole('button', { name: /create invite/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy invite cgraph01/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete invite cgraph01/i })).not.toBeInTheDocument();
  });

  it('keeps create draft open and shows a backend failure', async () => {
    mockCreateInvite.mockResolvedValue({
      ok: false,
      error: 'You do not have permission to create invites for this group.',
    });
    renderTab();

    fireEvent.click(screen.getByRole('button', { name: /^Create invite$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Create link$/i }));

    expect(
      await screen.findByText('You do not have permission to create invites for this group.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Expire after')).toHaveValue('86400');
  });

  it('requires confirmation before deleting and closes after durable success', async () => {
    renderTab();

    fireEvent.click(screen.getByRole('button', { name: /delete invite cgraph01/i }));
    expect(screen.getByRole('dialog', { name: 'Delete invite link' })).toBeInTheDocument();
    expect(mockDeleteInvite).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^Delete link$/i }));
    await waitFor(() => expect(mockDeleteInvite).toHaveBeenCalledWith('invite-1'));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Delete invite link' })).not.toBeInTheDocument()
    );
  });

  it('keeps delete confirmation actionable after failure', async () => {
    mockDeleteInvite.mockResolvedValue({
      ok: false,
      error: 'Could not delete the invite link.',
    });
    renderTab();

    fireEvent.click(screen.getByRole('button', { name: /delete invite cgraph01/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Delete link$/i }));

    expect(await screen.findByText('Could not delete the invite link.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Delete link$/i })).toBeEnabled();
  });

  it('offers retry when the invite list fails', () => {
    mockUseGroupInvites.mockReturnValue({
      ...mockUseGroupInvites(),
      invites: [],
      loadError: 'Could not load invites.',
    });
    renderTab();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mockReload).toHaveBeenCalledOnce();
  });
});
