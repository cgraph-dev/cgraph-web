/**
 * @file Tests for CategoryButton component (gif-picker)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CategoryButton } from '../gif-picker/category-button';
import type { CategoryButtonProps } from '../gif-picker/types';

function makeProps(overrides: Partial<CategoryButtonProps> = {}): CategoryButtonProps {
  return {
    category: {
      id: 'trending',
      name: 'Trending',
      icon: <span data-testid="category-icon">🔥</span>,
      searchTerm: 'trending',
    },
    isActive: false,
    onClick: vi.fn(),
    ...overrides,
  };
}

describe('CategoryButton', () => {
  it('renders category name', () => {
    render(<CategoryButton {...makeProps()} />);
    expect(screen.getByText('Trending')).toBeInTheDocument();
  });

  it('renders category icon', () => {
    render(<CategoryButton {...makeProps()} />);
    expect(screen.getByTestId('category-icon')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CategoryButton {...makeProps({ onClick })} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('uses the secondary canonical variant when active', () => {
    render(<CategoryButton {...makeProps({ isActive: true })} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-cgraph-variant', 'secondary');
  });

  it('uses the ghost canonical variant when inactive', () => {
    render(<CategoryButton {...makeProps({ isActive: false })} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveAttribute('data-cgraph-variant', 'ghost');
    expect(button).toHaveClass('cgraph-control');
  });

  it('renders different category names', () => {
    const category = {
      id: 'reactions',
      name: 'Reactions',
      icon: <span>😂</span>,
      searchTerm: 'reactions',
    };
    render(<CategoryButton {...makeProps({ category })} />);
    expect(screen.getByText('Reactions')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(<CategoryButton {...makeProps()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders icon and name together', () => {
    render(<CategoryButton {...makeProps()} />);
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Trending');
  });
});
