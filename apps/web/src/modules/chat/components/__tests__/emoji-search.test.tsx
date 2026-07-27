/**
 * @file Tests for EmojiSearch component (emoji-picker)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EmojiSearch } from '../emoji-picker/emoji-search';

describe('EmojiSearch', () => {
  it('renders search input with placeholder', () => {
    render(<EmojiSearch searchQuery="" onSearchChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search emojis...')).toBeInTheDocument();
  });

  it('renders search icon', () => {
    const { container } = render(<EmojiSearch searchQuery="" onSearchChange={vi.fn()} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('displays current search query', () => {
    render(<EmojiSearch searchQuery="smile" onSearchChange={vi.fn()} />);
    expect(screen.getByDisplayValue('smile')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<EmojiSearch searchQuery="" onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('Search emojis...');
    await user.type(input, 'h');
    expect(onSearchChange).toHaveBeenCalled();
  });

  it('shows clear button when search query is present', () => {
    render(<EmojiSearch searchQuery="hello" onSearchChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Clear emoji search' })).toHaveAttribute(
      'data-cgraph-surface',
      'control'
    );
  });

  it('does not show clear button when search query is empty', () => {
    render(<EmojiSearch searchQuery="" onSearchChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Clear emoji search' })).not.toBeInTheDocument();
  });

  it('clears search query when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<EmojiSearch searchQuery="hello" onSearchChange={onSearchChange} />);
    await user.click(screen.getByRole('button', { name: 'Clear emoji search' }));
    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('renders as a text input', () => {
    render(<EmojiSearch searchQuery="" onSearchChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search emojis...');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('input is focusable', async () => {
    const user = userEvent.setup();
    render(<EmojiSearch searchQuery="" onSearchChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search emojis...');
    await user.click(input);
    expect(input).toHaveFocus();
  });
});
