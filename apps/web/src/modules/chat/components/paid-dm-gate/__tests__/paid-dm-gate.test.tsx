/** @module PaidDmGate tests */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockPut = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

import { PaidDmGate } from '../paid-dm-gate';
import type { PaidDmPeer } from '../paid-dm-gate';

const PEER_GATED: PaidDmPeer = {
  userId: 'peer-1',
  paidDmEnabled: true,
  nodePrice: 50,
  displayName: 'Alice',
};

const PEER_OPEN: PaidDmPeer = {
  userId: 'peer-2',
  paidDmEnabled: false,
  nodePrice: 0,
};

describe('PaidDmGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPut.mockResolvedValue({ data: { data: {} } });
  });

  it('renders the gate when the peer has paid DMs enabled and viewer is not a friend', () => {
    render(
      <PaidDmGate
        peer={PEER_GATED}
        isFriend={false}
        balanceNodes={500}
        pendingFileId="file-1"
        onPaidSend={vi.fn()}
      />
    );

    expect(screen.getByTestId('paid-dm-gate')).toBeInTheDocument();
    expect(
      screen.getByText(/Send 50 Nodes to deliver this message to Alice/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay & Send/i })).toBeInTheDocument();
  });

  it('hides the gate when the peer is a friend', () => {
    const { container } = render(
      <PaidDmGate
        peer={PEER_GATED}
        isFriend
        balanceNodes={500}
        pendingFileId="file-1"
        onPaidSend={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('hides the gate when the peer has paid DMs disabled', () => {
    const { container } = render(
      <PaidDmGate
        peer={PEER_OPEN}
        isFriend={false}
        balanceNodes={500}
        pendingFileId="file-1"
        onPaidSend={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the after-send balance preview when funds are sufficient', () => {
    render(
      <PaidDmGate
        peer={PEER_GATED}
        isFriend={false}
        balanceNodes={200}
        pendingFileId="file-1"
        onPaidSend={vi.fn()}
      />
    );

    // 200 -> 150 after a 50-Node send
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('disables Pay & Send and surfaces a deficit alert when funds are insufficient', () => {
    render(
      <PaidDmGate
        peer={PEER_GATED}
        isFriend={false}
        balanceNodes={10}
        pendingFileId="file-1"
        onPaidSend={vi.fn()}
      />
    );

    expect(
      screen.getByText(/You need 40 more Nodes to send this DM/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay & Send/i })).toBeDisabled();
  });

  it('calls the unlock endpoint and onPaidSend when Pay & Send is clicked', async () => {
    const onPaidSend = vi.fn().mockResolvedValue(undefined);
    render(
      <PaidDmGate
        peer={PEER_GATED}
        isFriend={false}
        balanceNodes={500}
        pendingFileId="file-99"
        messageId="msg-7"
        onPaidSend={onPaidSend}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Pay & Send/i }));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/v1/paid-dm/file-99/unlock', {
        message_id: 'msg-7',
      });
    });
    await waitFor(() => {
      expect(onPaidSend).toHaveBeenCalledTimes(1);
    });
  });

  it('omits message_id from the payload when not provided', async () => {
    render(
      <PaidDmGate
        peer={PEER_GATED}
        isFriend={false}
        balanceNodes={500}
        pendingFileId="file-99"
        onPaidSend={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Pay & Send/i }));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/v1/paid-dm/file-99/unlock', {});
    });
  });

  it('surfaces an error message and does NOT invoke onPaidSend when unlock fails', async () => {
    const onPaidSend = vi.fn();
    mockPut.mockRejectedValueOnce(new Error('boom'));

    render(
      <PaidDmGate
        peer={PEER_GATED}
        isFriend={false}
        balanceNodes={500}
        pendingFileId="file-99"
        onPaidSend={onPaidSend}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Pay & Send/i }));

    await waitFor(() => {
      expect(screen.getByText(/Could not unlock this DM/i)).toBeInTheDocument();
    });
    expect(onPaidSend).not.toHaveBeenCalled();
  });

  it('renders a Cancel button when onCancel is provided', () => {
    const onCancel = vi.fn();
    render(
      <PaidDmGate
        peer={PEER_GATED}
        isFriend={false}
        balanceNodes={500}
        pendingFileId="file-1"
        onPaidSend={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
