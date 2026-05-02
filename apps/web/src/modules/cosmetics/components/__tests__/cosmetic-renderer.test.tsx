import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CosmeticRenderer } from '../cosmetic-renderer';
import type { CosmeticItem, CosmeticType } from '@cgraph/shared-types';

// Helpers

function makeItem(overrides: Partial<CosmeticItem> = {}): CosmeticItem {
  return {
    id: 'item-1',
    slug: 'test-item',
    name: 'Test Item',
    description: 'A test cosmetic',
    surface: 'avatar',
    type: 'badge',
    rarity: 'rare',
    unlockType: 'purchase',
    unlockCondition: { type: 'none', threshold: null },
    animationType: 'none',
    lottieFile: null,
    previewUrl: null,
    colors: ['#a855f7'],
    available: true,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  } as CosmeticItem;
}

// Tests

describe('CosmeticRenderer', () => {
  it('renders a border cosmetic as SVG', () => {
    const item = makeItem({ type: 'avatar_border', colors: ['#60a5fa'] });
    const { container } = render(<CosmeticRenderer item={item} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const rect = container.querySelector('rect');
    expect(rect?.getAttribute('stroke')).toBe('#60a5fa');
  });

  it('renders a border with dashed strokes when animationType is css', () => {
    const item = makeItem({
      type: 'avatar_border',
      animationType: 'css',
      colors: ['#ff0000'],
    });
    const { container } = render(<CosmeticRenderer item={item} />);

    const rect = container.querySelector('rect');
    expect(rect?.getAttribute('stroke-dasharray')).toBe('8 4');
  });

  it('renders border with inner ring when multiple colors', () => {
    const item = makeItem({
      type: 'avatar_border',
      colors: ['#ff0000', '#00ff00'],
    });
    const { container } = render(<CosmeticRenderer item={item} />);

    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(2);
    expect(rects[1]!.getAttribute('stroke')).toBe('#00ff00');
  });

  it('renders a title cosmetic as styled text', () => {
    const item = makeItem({ type: 'title', name: 'Champion', colors: ['#f59e0b'] });
    render(<CosmeticRenderer item={item} />);

    const title = screen.getByText('Champion');
    expect(title.style.color).toBe('rgb(245, 158, 11)');
  });

  it('renders a badge cosmetic with fallback icon when no previewUrl', () => {
    const item = makeItem({ type: 'badge', previewUrl: null });
    render(<CosmeticRenderer item={item} />);

    // Should show shield emoji as fallback
    expect(screen.getByText('🛡️')).toBeInTheDocument();
  });

  it('renders a badge cosmetic with image when previewUrl exists', () => {
    const item = makeItem({
      type: 'badge',
      previewUrl: 'https://cdn.example.com/badge.png',
    });
    render(<CosmeticRenderer item={item} />);

    const img = screen.getByAltText('Test Item');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/badge.png');
  });

  it('renders a nameplate cosmetic with gradient background', () => {
    const item = makeItem({
      type: 'nameplate',
      name: 'Elite Plate',
      colors: ['#1e293b', '#ffffff'],
    });
    render(<CosmeticRenderer item={item} />);

    expect(screen.getByText('Elite Plate')).toBeInTheDocument();
  });

  it('uses fallback renderer for unknown/unmapped types', () => {
    const item = makeItem({ type: 'chat_bubble' as CosmeticType, previewUrl: null });
    render(<CosmeticRenderer item={item} />);

    // Fallback shows gift emoji when no previewUrl
    expect(screen.getByText('🎁')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const item = makeItem({ type: 'badge' });
    const { container } = render(<CosmeticRenderer item={item} className="my-custom-class" />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('my-custom-class');
  });

  it('passes custom size to sub-renderer', () => {
    const item = makeItem({ type: 'avatar_border', colors: ['#ff0000'] });
    const { container } = render(<CosmeticRenderer item={item} size={128} />);

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('128');
    expect(svg?.getAttribute('height')).toBe('128');
  });

  it('defaults to size 64', () => {
    const item = makeItem({ type: 'avatar_border', colors: ['#ff0000'] });
    const { container } = render(<CosmeticRenderer item={item} />);

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('64');
  });

  it('uses default color when colors array is empty', () => {
    const item = makeItem({ type: 'avatar_border', colors: [] });
    const { container } = render(<CosmeticRenderer item={item} />);

    const rect = container.querySelector('rect');
    expect(rect?.getAttribute('stroke')).toBe('#60a5fa');
  });

  it('renders fallback with image when previewUrl is set', () => {
    const item = makeItem({
      type: 'theme',
      previewUrl: 'https://cdn.example.com/theme.png',
    });
    render(<CosmeticRenderer item={item} />);

    const img = screen.getByAltText('Test Item');
    expect(img).toBeInTheDocument();
  });

  it('wraps all renderers in inline-flex container', () => {
    const item = makeItem({ type: 'title' });
    const { container } = render(<CosmeticRenderer item={item} />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('inline-flex');
    expect(wrapper?.className).toContain('items-center');
    expect(wrapper?.className).toContain('justify-center');
  });
});
