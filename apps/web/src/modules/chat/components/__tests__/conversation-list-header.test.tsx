import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConversationListHeader } from '../conversation-list/conversation-list-header';

describe('ConversationListHeader', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    filter: 'all' as const,
    onFilterChange: vi.fn(),
    onNewChat: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the canonical title, action, and search controls', () => {
    render(<ConversationListHeader {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Messages' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New conversation' })).toHaveClass(
      'h-9',
      'min-h-9',
      'w-9',
      'min-w-9',
      'p-0',
    );

    const search = screen.getByRole('textbox', { name: 'Search messages' });
    expect(search.parentElement).toHaveClass('cgraph-search-field');
    expect(search.parentElement?.querySelector('.cgraph-search-icon')).toBeInTheDocument();
  });

  it('keeps search, filters, and new-conversation callbacks intact', () => {
    render(<ConversationListHeader {...defaultProps} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Search messages' }), {
      target: { value: 'hello' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Direct' }));
    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('hello');
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith('direct');
    expect(defaultProps.onNewChat).toHaveBeenCalledOnce();
  });

  it('exposes the active filter through the shared segmented contract', () => {
    render(<ConversationListHeader {...defaultProps} filter="group" />);

    expect(screen.getByRole('button', { name: 'Groups' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('shows the controlled search value', () => {
    render(<ConversationListHeader {...defaultProps} searchQuery="test query" />);

    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });
});
