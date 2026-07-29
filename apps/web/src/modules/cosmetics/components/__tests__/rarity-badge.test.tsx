import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RarityBadge } from '../rarity-badge';
import type { RarityTier } from '@cgraph-dev/shared-types';

describe('RarityBadge', () => {
  it('renders the rarity tier text', () => {
    render(<RarityBadge rarity="rare" />);

    expect(screen.getByText('rare')).toBeInTheDocument();
  });

  it('applies small size classes by default', () => {
    render(<RarityBadge rarity="common" />);

    const badge = screen.getByText('common');
    expect(badge.className).toContain('px-2');
    expect(badge.className).toContain('py-0.5');
    expect(badge.className).toContain('text-[10px]');
  });

  it('applies medium size classes when size="md"', () => {
    render(<RarityBadge rarity="common" size="md" />);

    const badge = screen.getByText('common');
    expect(badge.className).toContain('px-3');
    expect(badge.className).toContain('py-1');
    expect(badge.className).toContain('text-xs');
  });

  it('applies correct background for common rarity', () => {
    render(<RarityBadge rarity="common" />);

    const badge = screen.getByText('common');
    expect(badge.className).toContain('bg-gray-500/20');
    expect(badge.className).toContain('text-gray-300');
  });

  it('applies correct background for epic rarity', () => {
    render(<RarityBadge rarity="epic" />);

    const badge = screen.getByText('epic');
    expect(badge.className).toContain('bg-purple-500/20');
    expect(badge.className).toContain('text-purple-400');
  });

  it('applies correct background for legendary rarity', () => {
    render(<RarityBadge rarity="legendary" />);

    const badge = screen.getByText('legendary');
    expect(badge.className).toContain('bg-yellow-500/20');
    expect(badge.className).toContain('text-yellow-400');
  });

  it('applies correct background for mythic rarity', () => {
    render(<RarityBadge rarity="mythic" />);

    const badge = screen.getByText('mythic');
    expect(badge.className).toContain('bg-red-500/20');
    expect(badge.className).toContain('text-red-400');
  });

  it('applies correct background for free rarity', () => {
    render(<RarityBadge rarity="free" />);

    const badge = screen.getByText('free');
    expect(badge.className).toContain('bg-gray-600/30');
    expect(badge.className).toContain('text-gray-400');
  });

  it('renders as uppercase text', () => {
    render(<RarityBadge rarity="rare" />);

    const badge = screen.getByText('rare');
    expect(badge.className).toContain('uppercase');
  });

  it('sets border color via inline style', () => {
    render(<RarityBadge rarity="rare" />);

    const badge = screen.getByText('rare');
    expect(badge.style.borderColor).toBe('rgb(59, 130, 246)');
  });

  it('renders all 7 rarity tiers without error', () => {
    const tiers: RarityTier[] = [
      'free',
      'common',
      'uncommon',
      'rare',
      'epic',
      'legendary',
      'mythic',
    ];

    for (const tier of tiers) {
      const { unmount } = render(<RarityBadge rarity={tier} />);
      expect(screen.getByText(tier)).toBeInTheDocument();
      unmount();
    }
  });

  it('applies a compact text treatment', () => {
    render(<RarityBadge rarity="uncommon" />);

    const badge = screen.getByText('uncommon');
    expect(badge.className).toContain('font-semibold');
    expect(badge.className).not.toContain('tracking-wider');
  });
});
