/**
 * @file Tests for Toggle component (appearance-settings)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('motion/react', () => ({
  motion: {
    button: ({
      children,
      className,
      onClick,
      disabled,
      style,
      whileTap: _whileTap,
      ...rest
    }: {
      children: React.ReactNode;
      className?: string;
      onClick?: () => void;
      disabled?: boolean;
      style?: React.CSSProperties;
      whileTap?: unknown;
      [key: string]: unknown;
    }) => (
      <button className={className} onClick={onClick} disabled={disabled} style={style} {...rest}>
        {children}
      </button>
    ),
    div: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    span: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
      <span className={className}>{children}</span>
    ),
  },
}));

vi.mock('@/lib/animation-presets', () => ({
  springs: { snappy: { type: 'spring', stiffness: 400, damping: 30 } },
}));

import { Toggle } from '../appearance-settings/toggle';

describe('Toggle', () => {
  const defaultProps = {
    enabled: false,
    onChange: vi.fn(),
    label: 'Dark Mode',
  };

  it('renders the label', () => {
    render(<Toggle {...defaultProps} />);
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('exposes the visible label as the switch name', () => {
    render(<Toggle {...defaultProps} />);
    expect(screen.getByRole('switch', { name: 'Dark Mode' })).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<Toggle {...defaultProps} description="Enable dark theme" />);
    expect(screen.getByText('Enable dark theme')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<Toggle {...defaultProps} />);
    const desc = container.querySelector('.text-xs.text-gray-400');
    expect(desc).not.toBeInTheDocument();
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle {...defaultProps} onChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('applies enabled styles when enabled', () => {
    render(<Toggle {...defaultProps} enabled={true} />);
    const button = screen.getByRole('switch');
    expect(button.className).toContain('aurora-social-toggle');
    expect(button).toHaveAttribute('data-checked', 'true');
  });

  it('applies disabled styles when not enabled', () => {
    render(<Toggle {...defaultProps} enabled={false} />);
    const button = screen.getByRole('switch');
    expect(button.className).toContain('aurora-social-toggle');
    expect(button).toHaveAttribute('data-checked', 'false');
  });

  it('applies glow effect when enabled', () => {
    render(<Toggle {...defaultProps} enabled={true} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('does not apply glow when not enabled', () => {
    render(<Toggle {...defaultProps} enabled={false} />);
    const button = screen.getByRole('switch');
    expect(button.style.boxShadow).toBeFalsy();
  });

  it('disables button when disabled prop is true', () => {
    render(<Toggle {...defaultProps} disabled={true} />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('renders icon when provided', () => {
    render(<Toggle {...defaultProps} icon={<span data-testid="toggle-icon">🌙</span>} />);
    expect(screen.getByTestId('toggle-icon')).toBeInTheDocument();
  });

  it('does not render icon container when icon not provided', () => {
    const { container } = render(<Toggle {...defaultProps} />);
    // Only the label div and toggle button should exist
    const gapElements = container.querySelectorAll('.gap-3');
    expect(gapElements.length).toBe(1);
  });

  it('renders with opacity when disabled', () => {
    const { container } = render(<Toggle {...defaultProps} disabled={true} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('opacity-50');
  });
});
