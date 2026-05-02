/**
 * PulseDots Component Tests
 *
 * Tests for dot rendering per tier, color mapping, size variants,
 * label display, and tooltip.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PulseDots } from '../pulse-dots';
describe('PulseDots', () => {
  describe('tier rendering', () => {
    it('renders 0 filled dots for newcomer tier', () => {
      const { container } = render(<PulseDots score={0} tier="newcomer" />);
      const dots = container.querySelectorAll('span');
      // 5 dot spans + 1 label span
      const dotSpans = Array.from(dots).filter((s) => s.textContent === '\u25CF'); // ●
      const filledDots = dotSpans.filter((s) => !s.className.includes('opacity-40'));
      expect(filledDots).toHaveLength(0);
    });

    it('renders 1 filled dot for active tier', () => {
      const { container } = render(<PulseDots score={20} tier="active" />);
      const dotSpans = Array.from(container.querySelectorAll('span')).filter(
        (s) => s.textContent === '\u25CF'
      );
      const filledDots = dotSpans.filter((s) => s.className.includes('text-blue-400'));
      expect(filledDots).toHaveLength(1);
    });

    it('renders 2 filled dots for trusted tier', () => {
      const { container } = render(<PulseDots score={40} tier="trusted" />);
      const dotSpans = Array.from(container.querySelectorAll('span')).filter(
        (s) => s.textContent === '\u25CF'
      );
      const filledDots = dotSpans.filter((s) => s.className.includes('text-green-400'));
      expect(filledDots).toHaveLength(2);
    });

    it('renders 3 filled dots for expert tier', () => {
      const { container } = render(<PulseDots score={60} tier="expert" />);
      const dotSpans = Array.from(container.querySelectorAll('span')).filter(
        (s) => s.textContent === '\u25CF'
      );
      const filledDots = dotSpans.filter((s) => s.className.includes('text-purple-400'));
      expect(filledDots).toHaveLength(3);
    });

    it('renders 4 filled dots for authority tier', () => {
      const { container } = render(<PulseDots score={80} tier="authority" />);
      const dotSpans = Array.from(container.querySelectorAll('span')).filter(
        (s) => s.textContent === '\u25CF'
      );
      const filledDots = dotSpans.filter((s) => s.className.includes('text-amber-400'));
      expect(filledDots).toHaveLength(4);
    });

    it('renders 5 filled dots for legend tier', () => {
      const { container } = render(<PulseDots score={100} tier="legend" />);
      const dotSpans = Array.from(container.querySelectorAll('span')).filter(
        (s) => s.textContent === '\u25CF'
      );
      const filledDots = dotSpans.filter((s) => s.className.includes('text-yellow-300'));
      expect(filledDots).toHaveLength(5);
    });

    it('always renders exactly 5 dot elements', () => {
      const { container } = render(<PulseDots score={50} tier="trusted" />);
      const dotSpans = Array.from(container.querySelectorAll('span')).filter(
        (s) => s.textContent === '\u25CF'
      );
      expect(dotSpans).toHaveLength(5);
    });
  });

  describe('unknown tier', () => {
    it('falls back to newcomer defaults for unknown tier', () => {
      const { container } = render(<PulseDots score={0} tier="unknown_tier" />);
      const dotSpans = Array.from(container.querySelectorAll('span')).filter(
        (s) => s.textContent === '\u25CF'
      );
      // All dots should be unfilled (gray/opacity-40)
      const filledDots = dotSpans.filter((s) => !s.className.includes('opacity-40'));
      expect(filledDots).toHaveLength(0);
    });

    it('shows Newcomer label for unknown tier', () => {
      render(<PulseDots score={0} tier="unknown_tier" />);
      expect(screen.getByText('Newcomer')).toBeTruthy();
    });
  });

  describe('labels', () => {
    it('shows tier label by default', () => {
      render(<PulseDots score={50} tier="trusted" />);
      expect(screen.getByText('Trusted')).toBeTruthy();
    });

    it('hides tier label when showLabel is false', () => {
      render(<PulseDots score={50} tier="trusted" showLabel={false} />);
      expect(screen.queryByText('Trusted')).toBeNull();
    });

    it('renders correct label for each tier', () => {
      const tiers = [
        ['newcomer', 'Newcomer'],
        ['active', 'Active'],
        ['trusted', 'Trusted'],
        ['expert', 'Expert'],
        ['authority', 'Authority'],
        ['legend', 'Legend'],
      ] as const;

      for (const [tier, label] of tiers) {
        const { unmount } = render(<PulseDots score={50} tier={tier} />);
        expect(screen.getByText(label)).toBeTruthy();
        unmount();
      }
    });
  });

  describe('tooltip', () => {
    it('shows pulse score in title by default', () => {
      const { container } = render(<PulseDots score={42} tier="active" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.getAttribute('title')).toBe('Pulse: 42');
    });

    it('hides tooltip when showTooltip is false', () => {
      const { container } = render(<PulseDots score={42} tier="active" showTooltip={false} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.getAttribute('title')).toBeNull();
    });
  });

  describe('sizes', () => {
    it('applies md size classes by default', () => {
      const { container } = render(<PulseDots score={50} tier="trusted" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('text-sm');
      expect(wrapper.className).toContain('gap-1');
    });

    it('applies sm size classes', () => {
      const { container } = render(<PulseDots score={50} tier="trusted" size="sm" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('text-xs');
      expect(wrapper.className).toContain('gap-0.5');
    });

    it('applies lg size classes', () => {
      const { container } = render(<PulseDots score={50} tier="trusted" size="lg" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('text-base');
    });
  });

  it('accepts custom className', () => {
    const { container } = render(
      <PulseDots score={50} tier="trusted" className="my-custom-class" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('my-custom-class');
  });
});
