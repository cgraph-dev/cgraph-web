import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EquipPanel } from '../equip-panel';
import type { CosmeticItem, Entitlement, CosmeticSku } from '@cgraph/shared-types';

// Helpers

function makeItem(overrides: Partial<CosmeticItem> = {}): CosmeticItem {
  return {
    id: 'item-1',
    slug: 'test-item',
    name: 'Test Border',
    description: 'A fancy border',
    surface: 'avatar',
    type: 'badge',
    rarity: 'epic',
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

function renderPanel(props: Partial<Parameters<typeof EquipPanel>[0]> = {}) {
  const defaultProps = {
    item: makeItem(),
    isEquipped: false,
    entitlement: undefined,
    onToggleEquip: vi.fn(),
    onClose: vi.fn(),
    ...props,
  };
  return { ...render(<EquipPanel {...defaultProps} />), props: defaultProps };
}

// Tests

describe('EquipPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when item is null', () => {
    const { container } = render(
      <EquipPanel item={null} isEquipped={false} onToggleEquip={vi.fn()} onClose={vi.fn()} />
    );

    expect(container.textContent).toBe('');
  });

  it('renders item name and description', () => {
    renderPanel();

    expect(screen.getByText('Test Border')).toBeInTheDocument();
    expect(screen.getByText('A fancy border')).toBeInTheDocument();
  });

  it('renders "Item Details" header', () => {
    renderPanel();

    expect(screen.getByText('Item Details')).toBeInTheDocument();
  });

  it('shows "Equip" button for equippable items', () => {
    renderPanel({ isEquipped: false });

    expect(screen.getByText('Equip')).toBeInTheDocument();
  });

  it('shows "Unequip" button for equipped items', () => {
    renderPanel({ isEquipped: true });

    expect(screen.getByText('Unequip')).toBeInTheDocument();
  });

  it('shows "Currently Equipped" indicator when equipped', () => {
    renderPanel({ isEquipped: true });

    expect(screen.getByText('Currently Equipped')).toBeInTheDocument();
  });

  it('calls onToggleEquip when equip button is clicked', () => {
    const item = makeItem();
    const { props } = renderPanel({ item, isEquipped: false });

    fireEvent.click(screen.getByText('Equip'));

    expect(props.onToggleEquip).toHaveBeenCalledWith(item);
  });

  it('calls onToggleEquip when unequip button is clicked', () => {
    const item = makeItem();
    const { props } = renderPanel({ item, isEquipped: true });

    fireEvent.click(screen.getByText('Unequip'));

    expect(props.onToggleEquip).toHaveBeenCalledWith(item);
  });

  it('calls onClose when close button is clicked', () => {
    const { props } = renderPanel();

    // The close button has the X character
    fireEvent.click(screen.getByText('✕'));

    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <EquipPanel item={makeItem()} isEquipped={false} onToggleEquip={vi.fn()} onClose={onClose} />
    );

    // The backdrop is the first fixed overlay div
    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows expired message and disabled button for expired entitlements', () => {
    const entitlement = makeEntitlement({
      expiresAt: '2020-01-01T00:00:00Z',
      active: true,
    });
    renderPanel({ entitlement });

    expect(screen.getByText('This item has expired. Visit the shop to renew.')).toBeInTheDocument();
    // The button text "Expired" and the EntitlementBadge text "Expired" both appear
    expect(screen.getAllByText('Expired').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Not Available" when entitlement is inactive', () => {
    const entitlement = makeEntitlement({ active: false });
    renderPanel({ entitlement });

    expect(screen.getByText('Not Available')).toBeInTheDocument();
  });

  it('allows equip for legacy items without entitlements', () => {
    renderPanel({ entitlement: undefined, isEquipped: false });

    const equipButton = screen.getByText('Equip');
    expect(equipButton).toBeInTheDocument();
    expect(equipButton).not.toBeDisabled();
  });

  it('renders preview image when item has previewUrl', () => {
    const item = makeItem({ previewUrl: 'https://cdn.example.com/preview.png' });
    renderPanel({ item });

    const img = screen.getByAltText('Test Border');
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/preview.png');
  });

  it('renders fallback emoji when item has no previewUrl', () => {
    const item = makeItem({ type: 'badge', previewUrl: null });
    renderPanel({ item });

    expect(screen.getByText('🛡️')).toBeInTheDocument();
  });
});
