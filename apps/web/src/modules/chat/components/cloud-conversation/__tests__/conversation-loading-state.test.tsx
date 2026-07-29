import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConversationLoadingState } from '../conversation-loading-state';

describe('ConversationLoadingState', () => {
  it('announces the default loading state', () => {
    const { container } = render(<ConversationLoadingState />);

    expect(screen.getByRole('status', { name: 'Loading conversation' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
    expect(container.querySelectorAll('[data-cgraph-skeleton="true"]')).toHaveLength(5);
  });

  it('supports a route-specific accessible label', () => {
    render(<ConversationLoadingState label="Opening Vault" />);

    expect(screen.getByRole('status', { name: 'Opening Vault' })).toBeInTheDocument();
  });
});
