import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FeedModeTabs } from '../feed-mode-tabs';
import type { FeedMode } from '../../store/discoveryStore';

describe('FeedModeTabs', () => {
  it('renders all 5 mode tabs', () => {
    render(<FeedModeTabs activeMode="pulse" onModeChange={vi.fn()} />);

    expect(screen.getByText('Pulse')).toBeTruthy();
    expect(screen.getByText('Fresh')).toBeTruthy();
    expect(screen.getByText('Rising')).toBeTruthy();
    expect(screen.getByText('Deep Cut')).toBeTruthy();
    expect(screen.getByText('Frequency Surf')).toBeTruthy();
  });

  it('exposes the selected mode through pressed state', () => {
    render(<FeedModeTabs activeMode="rising" onModeChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Rising' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Fresh' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it.each<[string, FeedMode]>([
    ['Pulse', 'pulse'],
    ['Fresh', 'fresh'],
    ['Rising', 'rising'],
    ['Deep Cut', 'deep_cut'],
    ['Frequency Surf', 'frequency_surf'],
  ])('calls onModeChange with %s key when %s tab clicked', (label, expectedKey) => {
    const onModeChange = vi.fn();
    render(<FeedModeTabs activeMode="pulse" onModeChange={onModeChange} />);

    fireEvent.click(screen.getByText(label));
    expect(onModeChange).toHaveBeenCalledWith(expectedKey);
  });

  it('accepts custom className', () => {
    const { container } = render(
      <FeedModeTabs activeMode="pulse" onModeChange={vi.fn()} className="my-custom-class" />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('my-custom-class');
  });

  it('uses decorative icons without replacing accessible labels', () => {
    render(<FeedModeTabs activeMode="pulse" onModeChange={vi.fn()} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);

    for (const button of buttons) {
      expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
