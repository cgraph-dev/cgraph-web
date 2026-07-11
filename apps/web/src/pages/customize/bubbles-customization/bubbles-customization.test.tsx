import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import BubblesCustomization from './bubbles-customization';

vi.mock('@/stores/theme', () => {
  throw new Error('BubblesCustomization must not import the legacy theme store.');
});

vi.mock('@/modules/settings/components/customize/panels/chat-panel', () => ({
  ChatPanel: () => <div data-testid="chat-theme-panel" />,
}));

describe('BubblesCustomization', () => {
  it('mounts the persisted chat-theme surface without the legacy BubblesTab', () => {
    render(<BubblesCustomization />);

    expect(screen.getByTestId('chat-theme-panel')).toBeInTheDocument();
  });
});
