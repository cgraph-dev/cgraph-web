import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CosmeticCard } from '../cosmetic-card';
import type { CosmeticItem, Entitlement, CosmeticSku } from '@cgraph/shared-types';

// Helpers

function makeItem(overrides: Partial<CosmeticItem> = {}): CosmeticItem {
  return {
    id: 'item-1',
    slug: 'test-item',
    name: 'Cosmic Border',
    description: 'A cosmic border',
    surface: 'avatar',
    type: 'badge',
    rarity: 'rare',
    unlockType: 'purchase',
    unlockCondition: { type: 'none', threshold: null },
    animationType: 'none',
    lottieFile: null,
    previewUrl: null,
    colors: ['#3b82f6'],
    available: true,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  } as CosmeticItem;
}

function makeSku(overrides: Partial<CosmeticSku> = {}): CosmeticSku {
  return {
    id: 'sku-1',
    slug: 'test-sku',
    name: 'Test SKU',
    type: 'badge',
    assetHash: null,
    cosmeticId: 'item-1',
    priceNodes: 100,
    stripePriceId: null,
    isPremiumOnly: false,
    isAvailable: true,
    ...overrides,
  } as CosmeticSku;
}

function makeEntitlement(overrides: Partial<Entitlement> = {}): Entitlement {
  return {
    id: 'ent-1',
    sku: makeSku(),
    type: 'purchase',
    source: 'shop_purchase',
    grantedAt: '2025-01-01T00:00:00Z',
    expiresAt: null,
    active: true,
    ...overrides,
  } as Entitlement;
}

// Tests

describe('CosmeticCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders item name', () => {
    render(<CosmeticCard item={makeItem()} owned={true} equipped={false} />);

    expect(screen.getByText('Cosmic Border')).toBeInTheDocument();
  });

  it('renders RarityBadge', () => {
    render(<CosmeticCard item={makeItem({ rarity: 'legendary' })} owned={true} equipped={false} />);

    expect(screen.getByText('legendary')).toBeInTheDocument();
  });

  it('shows checkmark indicator when equipped', () => {
    render(<CosmeticCard item={makeItem()} owned={true} equipped={true} />);

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const item = makeItem();
    const onSelect = vi.fn();
    render(<CosmeticCard item={item} owned={true} equipped={false} onSelect={onSelect} />);

    // The card itself is a button
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledWith(item);
  });

  it('renders preview image when previewUrl exists', () => {
    const item = makeItem({ previewUrl: 'https://cdn.example.com/preview.png' });
    render(<CosmeticCard item={item} owned={true} equipped={false} />);

    expect(screen.getByAltText('Cosmic Border')).toBeInTheDocument();
  });

  it('renders fallback type icon when no previewUrl', () => {
    const item = makeItem({ type: 'badge', previewUrl: null });
    render(<CosmeticCard item={item} owned={true} equipped={false} />);

    // Badge type shows 🎁 (fallback) since 'badge' is not in TYPE_ICONS (TYPE_ICONS uses 'border' key)
    // Actually TYPE_ICONS has 'badge': '🛡️'
    expect(screen.getByText('🛡️')).toBeInTheDocument();
  });

  it('shows "Expired" overlay for expired entitlements', () => {
    const entitlement = makeEntitlement({
      expiresAt: '2020-01-01T00:00:00Z',
    });
    render(
      <CosmeticCard item={makeItem()} owned={true} equipped={false} entitlement={entitlement} />
    );

    // Multiple "Expired" texts may appear (overlay + badge)
    expect(screen.getAllByText('Expired').length).toBeGreaterThanOrEqual(1);
  });

  it('shows lock overlay for premium-only locked items', () => {
    const item = makeItem({
      unlockType: 'subscription',
      unlockCondition: { type: 'subscription_tier', threshold: null },
    });
    render(<CosmeticCard item={item} owned={false} equipped={false} />);

    expect(screen.getByText('🔒')).toBeInTheDocument();
  });

  it('shows purchase button for purchasable items', () => {
    const item = makeItem({ available: true, unlockType: 'purchase' });
    const onPurchase = vi.fn();
    render(<CosmeticCard item={item} owned={false} equipped={false} onPurchase={onPurchase} />);

    expect(screen.getByText('Get')).toBeInTheDocument();
  });

  it('calls onPurchase and stops propagation when purchase button clicked', () => {
    const item = makeItem({ available: true, unlockType: 'purchase' });
    const onPurchase = vi.fn();
    const onSelect = vi.fn();
    render(
      <CosmeticCard
        item={item}
        owned={false}
        equipped={false}
        onPurchase={onPurchase}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText('Get'));

    expect(onPurchase).toHaveBeenCalledWith(item);
    // onSelect should NOT be called because stopPropagation
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows threshold-based price when unlockCondition has threshold', () => {
    const item = makeItem({
      available: true,
      unlockType: 'purchase',
      unlockCondition: { type: 'free', threshold: 500 },
    });
    render(<CosmeticCard item={item} owned={false} equipped={false} onPurchase={vi.fn()} />);

    expect(screen.getByText('500 Nodes')).toBeInTheDocument();
  });

  it('applies equipped card classes when equipped', () => {
    render(<CosmeticCard item={makeItem()} owned={true} equipped={true} />);

    expect(screen.getByRole('button', { name: 'Cosmic Border' }).className).toContain(
      'border-cyan-500/60'
    );
  });

  it('applies expired card classes with grayscale when expired', () => {
    const entitlement = makeEntitlement({
      expiresAt: '2020-01-01T00:00:00Z',
    });
    render(
      <CosmeticCard item={makeItem()} owned={true} equipped={false} entitlement={entitlement} />
    );

    expect(screen.getByRole('button', { name: 'Cosmic Border' }).className).toContain('grayscale');
  });

  it('does not show purchase button when item is not purchasable', () => {
    render(<CosmeticCard item={makeItem()} owned={true} equipped={false} onPurchase={vi.fn()} />);

    expect(screen.queryByText('Get')).not.toBeInTheDocument();
  });

  it('renders entitlement type as capitalized text when entitlement exists', () => {
    const entitlement = makeEntitlement({ type: 'purchase' });
    render(
      <CosmeticCard item={makeItem()} owned={true} equipped={false} entitlement={entitlement} />
    );

    expect(screen.getByText('purchase')).toBeInTheDocument();
  });
});
