import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { TransactionRow } from '../transaction-row';
import type { Transaction } from '@cgraph/api-client';
import type { NodeTransaction } from '../../types';

const makeTransaction = (overrides?: Partial<Transaction>): Transaction => ({
  id: 'tx-1',
  amount: 100,
  type: 'tip_received',
  reference_id: null,
  reference_type: null,
  platform_cut: 20,
  net_amount: 80,
  inserted_at: '2026-03-15T14:30:00Z',
  ...overrides,
});

describe('TransactionRow', () => {
  it('renders correct label for purchase type', () => {
    render(<TransactionRow transaction={makeTransaction({ type: 'purchase' })} />);
    expect(screen.getByText('Purchase')).toBeInTheDocument();
  });

  it('renders correct label for tip_sent type', () => {
    render(<TransactionRow transaction={makeTransaction({ type: 'tip_sent', amount: -50 })} />);
    expect(screen.getByText('Tip Sent')).toBeInTheDocument();
  });

  it('renders correct label for tip_received type', () => {
    render(<TransactionRow transaction={makeTransaction({ type: 'tip_received' })} />);
    expect(screen.getByText('Tip Received')).toBeInTheDocument();
  });

  it('renders correct label for content_unlock type', () => {
    render(
      <TransactionRow transaction={makeTransaction({ type: 'content_unlock', amount: -200 })} />
    );
    expect(screen.getByText('Content Unlock')).toBeInTheDocument();
  });

  it('renders correct label for withdrawal type', () => {
    render(<TransactionRow transaction={makeTransaction({ type: 'withdrawal', amount: -1000 })} />);
    expect(screen.getByText('Withdrawal')).toBeInTheDocument();
  });

  it('renders correct label for cosmetic_purchase type', () => {
    render(
      <TransactionRow transaction={makeTransaction({ type: 'cosmetic_purchase', amount: -150 })} />
    );
    expect(screen.getByText('Cosmetic')).toBeInTheDocument();
  });

  it('renders correct label for subscription_received type', () => {
    render(<TransactionRow transaction={makeTransaction({ type: 'subscription_received' })} />);
    expect(screen.getByText('Subscription')).toBeInTheDocument();
  });

  it('renders fallback label for unknown transaction type', () => {
    // The component's type prop accepts string (widened from TransactionType)
    // because the API may return unrecognized types at runtime.
    render(<TransactionRow transaction={makeTransaction({ type: 'unknown_type' })} />);
    expect(screen.getByText('Transaction')).toBeInTheDocument();
  });
  it('shows positive amount with + prefix and green color', () => {
    render(<TransactionRow transaction={makeTransaction({ amount: 500 })} />);

    const amountEl = screen.getByText(/\+/);
    expect(amountEl).toHaveClass('text-green-500');
    expect(amountEl.textContent).toContain('500');
  });

  it('shows negative amount without + prefix and red color', () => {
    render(<TransactionRow transaction={makeTransaction({ amount: -200 })} />);

    const amountEl = screen.getByText(/200/);
    expect(amountEl).toHaveClass('text-red-500');
    expect(amountEl.textContent).not.toContain('+');
  });

  it('formats large amounts with locale separators', () => {
    render(<TransactionRow transaction={makeTransaction({ amount: 10000 })} />);
    expect(screen.getByText(/10,000/)).toBeInTheDocument();
  });
  it('formats the inserted_at date', () => {
    render(
      <TransactionRow transaction={makeTransaction({ inserted_at: '2026-03-15T14:30:00Z' })} />
    );

    // The exact format depends on locale, but should contain "Mar" and "15"
    const dateText = screen.getByText(/Mar.*15/);
    expect(dateText).toBeInTheDocument();
  });
  it('renders the correct icon for each transaction type', () => {
    const { rerender } = render(
      <TransactionRow transaction={makeTransaction({ type: 'purchase' })} />
    );

    // Each type has a specific emoji icon
    const typesAndIcons: [NodeTransaction['type'] | string, string][] = [
      ['purchase', '💎'],
      ['tip_sent', '🎁'],
      ['tip_received', '🎁'],
      ['content_unlock', '🔓'],
      ['subscription_sent', '💸'],
      ['cosmetic_purchase', '🎨'],
    ];

    for (const [type, icon] of typesAndIcons) {
      rerender(
        <TransactionRow
          transaction={makeTransaction({
            type,
            amount:
              type.includes('sent') ||
              type.includes('unlock') ||
              type === 'subscription_sent' ||
              type === 'cosmetic_purchase'
                ? -100
                : 100,
          })}
        />
      );
      expect(screen.getByText(icon)).toBeInTheDocument();
    }
  });
});
