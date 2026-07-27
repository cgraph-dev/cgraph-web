/** @module message-action-menu tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { MessageActionMenu } from '../message-bubble/message-action-menu';

describe('MessageActionMenu', () => {
  const defaultProps = {
    onReply: vi.fn(),
    onEdit: vi.fn(),
    onPin: vi.fn(),
    onForward: vi.fn(),
    onDelete: vi.fn(),
    onSelect: vi.fn(),
    isMenuOpen: false,
    onToggleMenu: vi.fn(),
    isOwn: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses canonical controls for reply and menu triggers', () => {
    render(<MessageActionMenu {...defaultProps} />);

    for (const name of ['Reply to message', 'More message actions']) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('data-cgraph-surface', 'control');
      expect(button).toHaveClass('cgraph-control', 'cgraph-control-icon');
    }
  });

  it('calls onReply when reply button clicked', () => {
    render(<MessageActionMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reply to message' }));
    expect(defaultProps.onReply).toHaveBeenCalled();
  });

  it('calls onToggleMenu when more button clicked', () => {
    render(<MessageActionMenu {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'More message actions' }));
    expect(defaultProps.onToggleMenu).toHaveBeenCalled();
  });

  it('shows dropdown actions when menu is open', () => {
    render(<MessageActionMenu {...defaultProps} isMenuOpen={true} />);
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Pin')).toBeInTheDocument();
    expect(screen.getByText('Forward')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('uses canonical menu items and a destructive delete variant', () => {
    render(<MessageActionMenu {...defaultProps} isMenuOpen />);

    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(5);
    for (const item of items) {
      expect(item).toHaveAttribute('type', 'button');
      expect(item).toHaveAttribute('data-cgraph-surface', 'control');
      expect(item).toHaveClass('cgraph-control');
    }
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'data-cgraph-variant',
      'danger'
    );
  });

  it('hides dropdown when menu is closed', () => {
    render(<MessageActionMenu {...defaultProps} isMenuOpen={false} />);
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('calls onEdit when Edit clicked', () => {
    render(<MessageActionMenu {...defaultProps} isMenuOpen={true} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(defaultProps.onEdit).toHaveBeenCalled();
  });

  it('calls onDelete when Delete clicked', () => {
    render(<MessageActionMenu {...defaultProps} isMenuOpen={true} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(defaultProps.onDelete).toHaveBeenCalled();
  });

  it('calls onForward when Forward clicked', () => {
    render(<MessageActionMenu {...defaultProps} isMenuOpen={true} />);
    fireEvent.click(screen.getByText('Forward'));
    expect(defaultProps.onForward).toHaveBeenCalled();
  });
});
