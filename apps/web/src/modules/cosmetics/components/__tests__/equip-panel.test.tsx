import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CosmeticItem, CosmeticSku, Entitlement } from '@cgraph-dev/shared-types';
import { EquipPanel } from '../equip-panel';

function makeItem(overrides: Partial<CosmeticItem> = {}): CosmeticItem {
  return {
    id: 'item-1',
    slug: 'test-border',
    name: 'Test Border',
    description: 'A refined border',
    surface: 'avatar_border',
    type: 'avatar_border',
    rarity: 'epic',
    unlockType: 'purchase',
    unlockCondition: { type: 'purchase', threshold: 100 },
    animationType: 'none',
    lottieFile: null,
    previewUrl: null,
    colors: ['#a855f7'],
    available: true,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as CosmeticItem;
}

function makeSku(overrides: Partial<CosmeticSku> = {}): CosmeticSku {
  return {
    id: 'sku-1',
    slug: 'test-border',
    name: 'Test Border',
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

function renderPanel(props: Partial<Parameters<typeof EquipPanel>[0]> = {}) {
  const panelProps: Parameters<typeof EquipPanel>[0] = {
    item: makeItem(),
    owned: true,
    isEquipped: false,
    onToggleEquip: vi.fn(),
    onClose: vi.fn(),
    ...props,
  };
  render(<EquipPanel {...panelProps} />);
  return panelProps;
}

describe('EquipPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not mount a dialog without a selected item', () => {
    renderPanel({ item: null });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders owned item details and equips the selected item', () => {
    const props = renderPanel();

    expect(screen.getByRole('dialog', { name: 'Cosmetic details' })).toBeInTheDocument();
    expect(screen.getByText('Test Border')).toBeInTheDocument();
    expect(screen.getByText('A refined border')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Equip' }));
    expect(props.onToggleEquip).toHaveBeenCalledWith(props.item);
  });

  it('shows and invokes the unequip action for equipped items', () => {
    const props = renderPanel({ isEquipped: true });

    expect(screen.getByText('Currently equipped')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Unequip' }));
    expect(props.onToggleEquip).toHaveBeenCalledWith(props.item);
  });

  it('closes from the icon action and backdrop', () => {
    const onClose = vi.fn();
    renderPanel({ onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Close cosmetic details' }));
    fireEvent.click(screen.getByTestId('dialog-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('shows an honest preview-only state for unowned items', () => {
    renderPanel({ owned: false });

    expect(screen.getByText(/Preview only/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Equip' })).not.toBeInTheDocument();
  });

  it('disables expired owned items', () => {
    renderPanel({
      entitlement: makeEntitlement({ expiresAt: '2020-01-01T00:00:00Z' }),
    });

    expect(screen.getByRole('button', { name: 'Expired' })).toBeDisabled();
  });

  it('renders preview media or a shared category icon without emoji fallbacks', () => {
    const { rerender, container } = render(
      <EquipPanel
        item={makeItem({ previewUrl: 'https://cdn.example.com/preview.png' })}
        owned
        isEquipped={false}
        onToggleEquip={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole('dialog').querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.example.com/preview.png'
    );

    rerender(
      <EquipPanel
        item={makeItem({ previewUrl: null })}
        owned
        isEquipped={false}
        onToggleEquip={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.textContent).not.toContain('🛡️');
    expect(screen.getByRole('dialog').querySelector('svg')).toBeInTheDocument();
  });
});
