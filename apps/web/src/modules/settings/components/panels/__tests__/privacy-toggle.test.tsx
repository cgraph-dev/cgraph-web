
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PrivacyToggle } from '../privacy-toggle';

describe('PrivacyToggle', () => {
  const defaultProps = {
    label: 'Online Status',
    description: 'Show when you are online',
    checked: false,
    disabled: false,
    onToggle: vi.fn(),
  };

  it('renders the label', () => {
    render(<PrivacyToggle {...defaultProps} />);
    expect(screen.getByText('Online Status')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<PrivacyToggle {...defaultProps} />);
    expect(screen.getByText('Show when you are online')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<PrivacyToggle {...defaultProps} onToggle={onToggle} />);
    await user.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('sets aria-checked when checked is true', () => {
    render(<PrivacyToggle {...defaultProps} checked={true} />);
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-checked', 'true');
  });

  it('sets aria-checked when checked is false', () => {
    render(<PrivacyToggle {...defaultProps} checked={false} />);
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-checked', 'false');
  });

  it('disables button when disabled is true', () => {
    render(<PrivacyToggle {...defaultProps} disabled={true} />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('applies opacity when disabled', () => {
    render(<PrivacyToggle {...defaultProps} disabled={true} />);
    const button = screen.getByRole('switch');
    expect(button.className).toContain('opacity-50');
  });

  it('does not call onToggle when disabled', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<PrivacyToggle {...defaultProps} onToggle={onToggle} disabled={true} />);
    await user.click(screen.getByRole('switch'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('renders toggle knob', () => {
    const { container } = render(<PrivacyToggle {...defaultProps} />);
    const knob = container.querySelector('.aurora-social-toggle-thumb');
    expect(knob).toBeInTheDocument();
  });

  it('marks switch state via data attribute when checked', () => {
    const { container } = render(<PrivacyToggle {...defaultProps} checked={true} />);
    const button = container.querySelector('[role="switch"]');
    expect(button).toHaveAttribute('data-checked', 'true');
  });

  it('renders label as h3', () => {
    render(<PrivacyToggle {...defaultProps} />);
    const label = screen.getByText('Online Status');
    expect(label.tagName).toBe('H3');
  });
});
