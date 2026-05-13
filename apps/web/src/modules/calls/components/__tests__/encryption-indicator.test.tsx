/**
 * @file Tests for EncryptionIndicator component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@heroicons/react/24/solid', () => ({
  LockClosedIcon: ({ className }: { className?: string }) => (
    <span data-testid="lock-closed-icon" className={className} />
  ),
  LockOpenIcon: ({ className }: { className?: string }) => (
    <span data-testid="lock-open-icon" className={className} />
  ),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ExclamationTriangleIcon: ({ className }: { className?: string }) => (
    <span data-testid="warning-icon" className={className} />
  ),
}));

import { EncryptionIndicator } from '../encryption-indicator';

describe('EncryptionIndicator', () => {
  it('renders enabled state with closed lock icon', () => {
    render(<EncryptionIndicator status="enabled" />);
    expect(screen.getByTestId('lock-closed-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('lock-open-icon')).not.toBeInTheDocument();
  });

  it('renders disabled state with open lock icon', () => {
    render(<EncryptionIndicator status="disabled" />);
    expect(screen.getByTestId('lock-open-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('lock-closed-icon')).not.toBeInTheDocument();
  });

  it('renders degraded state with closed lock and warning icon', () => {
    render(<EncryptionIndicator status="degraded" />);
    expect(screen.getByTestId('lock-closed-icon')).toBeInTheDocument();
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
  });

  it('does not show warning icon for enabled status', () => {
    render(<EncryptionIndicator status="enabled" />);
    expect(screen.queryByTestId('warning-icon')).not.toBeInTheDocument();
  });

  it('does not show warning icon for disabled status', () => {
    render(<EncryptionIndicator status="disabled" />);
    expect(screen.queryByTestId('warning-icon')).not.toBeInTheDocument();
  });

  it('shows label text when showLabel is true for enabled', () => {
    render(<EncryptionIndicator status="enabled" showLabel />);
    expect(screen.getByText('Encrypted')).toBeInTheDocument();
  });

  it('shows label text when showLabel is true for disabled', () => {
    render(<EncryptionIndicator status="disabled" showLabel />);
    expect(screen.getByText('Not Encrypted')).toBeInTheDocument();
  });

  it('shows label text when showLabel is true for degraded', () => {
    render(<EncryptionIndicator status="degraded" showLabel />);
    expect(screen.getByText('Partially Encrypted')).toBeInTheDocument();
  });

  it('does not show label text by default', () => {
    render(<EncryptionIndicator status="enabled" />);
    expect(screen.queryByText('Encrypted')).not.toBeInTheDocument();
  });

  it('has correct tooltip for enabled status', () => {
    render(<EncryptionIndicator status="enabled" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'This call is end-to-end encrypted'
    );
  });

  it('has correct tooltip for disabled status', () => {
    render(<EncryptionIndicator status="disabled" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'This call is not end-to-end encrypted'
    );
  });

  it('has correct tooltip for degraded status', () => {
    render(<EncryptionIndicator status="degraded" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Encryption is degraded — some participants may not be encrypted'
    );
  });

  it('applies green styling for enabled status', () => {
    render(<EncryptionIndicator status="enabled" />);
    const container = screen.getByRole('status');
    expect(container.className).toContain('bg-green-500/10');
    expect(container.className).toContain('border-green-500/20');
  });

  it('applies amber styling for degraded status', () => {
    render(<EncryptionIndicator status="degraded" />);
    const container = screen.getByRole('status');
    expect(container.className).toContain('bg-amber-500/10');
  });

  it('applies gray styling for disabled status', () => {
    render(<EncryptionIndicator status="disabled" />);
    const container = screen.getByRole('status');
    expect(container.className).toContain('bg-gray-500/10');
  });

  it('accepts custom className', () => {
    render(<EncryptionIndicator status="enabled" className="my-custom-class" />);
    const container = screen.getByRole('status');
    expect(container.className).toContain('my-custom-class');
  });
});
