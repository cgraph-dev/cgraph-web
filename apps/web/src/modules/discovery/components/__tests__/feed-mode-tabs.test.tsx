/**
 * FeedModeTabs Component Tests
 *
 * Tests for rendering all 5 feed modes, active state styling,
 * and mode change callbacks.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('applies active styling to the selected tab', () => {
    render(<FeedModeTabs activeMode="rising" onModeChange={vi.fn()} />);

    const risingButton = screen.getByText('Rising').closest('button')!;
    expect(risingButton.className).toContain('bg-white/15');
    expect(risingButton.className).toContain('text-white');
  });

  it('applies inactive styling to non-selected tabs', () => {
    render(<FeedModeTabs activeMode="pulse" onModeChange={vi.fn()} />);

    const freshButton = screen.getByText('Fresh').closest('button')!;
    expect(freshButton.className).toContain('text-white/50');
    expect(freshButton.className).not.toContain('bg-white/15');
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

  it('renders icons alongside labels', () => {
    render(<FeedModeTabs activeMode="pulse" onModeChange={vi.fn()} />);

    // Each button should have two span children: icon + label
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);

    for (const button of buttons) {
      const spans = button.querySelectorAll('span');
      expect(spans.length).toBe(2);
    }
  });
});
