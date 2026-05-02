import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { BundleCard } from '../bundle-card';
const makeBundle = (overrides?: Record<string, unknown>) => ({
  id: 'bundle-1',
  name: 'Starter Pack',
  nodes: 500,
  price: 4.99,
  bonus_percent: 0,
  popular: false,
  is_active: true,
  ...overrides,
});

const makeDefaultProps = (overrides?: Record<string, unknown>) => ({
  bundle: makeBundle(),
  onBuy: vi.fn(),
  isLoading: false,
  ...overrides,
});

describe('BundleCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders bundle name', () => {
    render(<BundleCard {...makeDefaultProps()} />);
    expect(screen.getByText('Starter Pack')).toBeInTheDocument();
  });

  it('renders node count formatted with locale', () => {
    render(<BundleCard {...makeDefaultProps({ bundle: makeBundle({ nodes: 10000 }) })} />);
    expect(screen.getByText('10,000')).toBeInTheDocument();
  });

  it('renders price with two decimal places', () => {
    render(<BundleCard {...makeDefaultProps()} />);
    expect(screen.getByText('€4.99')).toBeInTheDocument();
  });

  it('renders Purchase button', () => {
    render(<BundleCard {...makeDefaultProps()} />);
    expect(screen.getByText('Purchase')).toBeInTheDocument();
  });
  it('shows bonus badge when bonus_percent > 0', () => {
    render(
      <BundleCard
        {...makeDefaultProps({
          bundle: makeBundle({ bonus_percent: 15 }),
        })}
      />
    );
    expect(screen.getByText('+15% BONUS')).toBeInTheDocument();
  });

  it('hides bonus badge when bonus_percent is 0', () => {
    render(<BundleCard {...makeDefaultProps()} />);
    expect(screen.queryByText(/BONUS/)).not.toBeInTheDocument();
  });
  it('shows "Most Popular" badge when popular is true', () => {
    render(
      <BundleCard
        {...makeDefaultProps({
          bundle: makeBundle({ popular: true }),
        })}
      />
    );
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('hides "Most Popular" badge when popular is false', () => {
    render(<BundleCard {...makeDefaultProps()} />);
    expect(screen.queryByText('Most Popular')).not.toBeInTheDocument();
  });
  it('calls onBuy with bundle id when Purchase is clicked', () => {
    const onBuy = vi.fn();
    render(<BundleCard {...makeDefaultProps({ onBuy })} />);

    fireEvent.click(screen.getByText('Purchase'));

    expect(onBuy).toHaveBeenCalledWith('bundle-1');
  });

  it('calls onBuy with correct id for different bundles', () => {
    const onBuy = vi.fn();
    render(
      <BundleCard
        {...makeDefaultProps({
          bundle: makeBundle({ id: 'bundle-premium' }),
          onBuy,
        })}
      />
    );

    fireEvent.click(screen.getByText('Purchase'));

    expect(onBuy).toHaveBeenCalledWith('bundle-premium');
  });
  it('disables Purchase button when isLoading is true', () => {
    render(<BundleCard {...makeDefaultProps({ isLoading: true })} />);

    // When loading, the button text is replaced with a spinner div
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('hides Purchase text when isLoading', () => {
    render(<BundleCard {...makeDefaultProps({ isLoading: true })} />);
    expect(screen.queryByText('Purchase')).not.toBeInTheDocument();
  });

  it('shows Purchase text when not loading', () => {
    render(<BundleCard {...makeDefaultProps({ isLoading: false })} />);
    expect(screen.getByText('Purchase')).toBeInTheDocument();
  });
});
