import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CosmeticItem, CosmeticSku, Entitlement } from '@cgraph-dev/shared-types';
import { CosmeticCard } from '../cosmetic-card';

function makeItem(overrides: Partial<CosmeticItem> = {}): CosmeticItem {
  return {
    id: 'item-1',
    slug: 'cosmic-border',
    name: 'Cosmic Border',
    description: 'A cosmic border',
    surface: 'avatar_border',
    type: 'avatar_border',
    rarity: 'rare',
    unlockType: 'purchase',
    unlockCondition: { type: 'purchase', threshold: 100 },
    animationType: 'none',
    lottieFile: null,
    previewUrl: null,
    colors: ['#3b82f6'],
    available: true,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as CosmeticItem;
}

function makeSku(overrides: Partial<CosmeticSku> = {}): CosmeticSku {
  return {
    id: 'sku-1',
    slug: 'cosmic-border',
    name: 'Cosmic Border',
    type: 'avatar_border',
    assetHash: null,
    cosmeticId: 'item-1',
    priceNodes: 100,
    stripePriceId: null,
    isPremiumOnly: false,
    isAvailable: true,
    collection: null,
    version: 1,
    ...overrides,
  } as CosmeticSku;
}

function makeEntitlement(overrides: Partial<Entitlement> = {}): Entitlement {
  return {
    id: 'entitlement-1',
    sku: makeSku(),
    type: 'purchase',
    source: 'shop_purchase',
    grantedAt: '2026-01-01T00:00:00Z',
    expiresAt: null,
    active: true,
    ...overrides,
  };
}

describe('CosmeticCard', () => {
  it('renders the item, category, and rarity as one accessible preview action', () => {
    render(<CosmeticCard item={makeItem()} owned equipped={false} />);

    expect(screen.getByRole('button', { name: 'View Cosmic Border' })).toBeInTheDocument();
    expect(screen.getByText('avatar border')).toBeInTheDocument();
    expect(screen.getByText('rare')).toBeInTheDocument();
    expect(screen.getByText('Owned')).toBeInTheDocument();
  });

  it('calls onSelect with the selected item', () => {
    const item = makeItem();
    const onSelect = vi.fn();
    render(<CosmeticCard item={item} owned equipped={false} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'View Cosmic Border' }));

    expect(onSelect).toHaveBeenCalledWith(item);
  });

  it('uses decorative lazy-loaded preview media when available', () => {
    const { container } = render(
      <CosmeticCard
        item={makeItem({ previewUrl: 'https://cdn.example.com/preview.png' })}
        owned
        equipped={false}
      />
    );

    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', 'https://cdn.example.com/preview.png');
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('uses the shared category icon when preview media is absent', () => {
    const { container } = render(
      <CosmeticCard item={makeItem({ type: 'badge' })} owned equipped={false} />
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.textContent).not.toContain('🛡️');
  });

  it('exposes equipped state without changing the card dimensions', () => {
    render(<CosmeticCard item={makeItem()} owned equipped />);

    expect(screen.getByText('Equipped')).toBeInTheDocument();
    expect(screen.getByTestId('cosmetic-card')).toHaveAttribute('data-state', 'equipped');
  });

  it('shows locked premium state without a fake purchase control', () => {
    render(
      <CosmeticCard
        item={makeItem({
          unlockType: 'subscription',
          unlockCondition: { type: 'subscription_tier', threshold: null },
        })}
        owned={false}
        equipped={false}
      />
    );

    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.queryByText('Get')).not.toBeInTheDocument();
  });

  it('shows expired entitlement state', () => {
    render(
      <CosmeticCard
        item={makeItem()}
        owned
        equipped={false}
        entitlement={makeEntitlement({ expiresAt: '2020-01-01T00:00:00Z' })}
      />
    );

    expect(screen.getByText('Expired')).toBeInTheDocument();
  });
});
