/** @module FileUnlockModal tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { FileUnlockModal } from '../file-unlock-modal';
function makeFile(overrides: Record<string, unknown> = {}) {
  return {
    fileName: 'vacation-photo.jpg',
    fileType: 'image',
    price: 50,
    ...overrides,
  };
}

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  file: makeFile(),
  userBalance: 100,
  onConfirm: vi.fn(),
};

function renderModal(overrides: Record<string, unknown> = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(<FileUnlockModal {...(props as React.ComponentProps<typeof FileUnlockModal>)} />);
}
describe('FileUnlockModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders nothing when isOpen is false', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it('renders the dialog when isOpen is true', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Unlock File')).toBeInTheDocument();
  });
  it('displays the file name', () => {
    renderModal();
    expect(screen.getByText('vacation-photo.jpg')).toBeInTheDocument();
  });

  it('displays the file type', () => {
    renderModal({ file: makeFile({ fileType: 'video' }) });
    expect(screen.getByText('video')).toBeInTheDocument();
  });

  it('displays the price in Nodes', () => {
    renderModal({ file: makeFile({ price: 75 }) });
    expect(screen.getByText('75 Nodes')).toBeInTheDocument();
  });

  it('displays the user balance', () => {
    renderModal({ userBalance: 200 });
    expect(screen.getByText('200 Nodes')).toBeInTheDocument();
  });
  it('enables Confirm Unlock button when balance is sufficient', () => {
    renderModal({ userBalance: 100, file: makeFile({ price: 50 }) });

    const confirmBtn = screen.getByText('Confirm Unlock');
    expect(confirmBtn).not.toBeDisabled();
  });

  it('does not show insufficient balance warning when balance is enough', () => {
    renderModal({ userBalance: 100, file: makeFile({ price: 50 }) });
    expect(screen.queryByText(/Insufficient balance/)).toBeNull();
  });

  it('calls onConfirm when Confirm Unlock is clicked with sufficient balance', () => {
    const onConfirm = vi.fn();
    renderModal({ userBalance: 100, file: makeFile({ price: 50 }), onConfirm });

    fireEvent.click(screen.getByText('Confirm Unlock'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
  it('disables Confirm Unlock button when balance is insufficient', () => {
    renderModal({ userBalance: 30, file: makeFile({ price: 50 }) });

    const confirmBtn = screen.getByText('Confirm Unlock');
    expect(confirmBtn).toBeDisabled();
  });

  it('shows insufficient balance warning with needed amount', () => {
    renderModal({ userBalance: 30, file: makeFile({ price: 50 }) });

    expect(screen.getByText(/Insufficient balance/)).toBeInTheDocument();
    expect(screen.getByText(/20 more Nodes/)).toBeInTheDocument();
  });

  it('does not call onConfirm when balance is insufficient', () => {
    const onConfirm = vi.fn();
    renderModal({ userBalance: 10, file: makeFile({ price: 50 }), onConfirm });

    fireEvent.click(screen.getByText('Confirm Unlock'));
    expect(onConfirm).not.toHaveBeenCalled();
  });
  it('allows confirm when balance equals price exactly', () => {
    const onConfirm = vi.fn();
    renderModal({ userBalance: 50, file: makeFile({ price: 50 }), onConfirm });

    expect(screen.queryByText(/Insufficient balance/)).toBeNull();

    fireEvent.click(screen.getByText('Confirm Unlock'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('has aria-modal="true" on the dialog', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
