import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatPanel } from '../chat-panel';

const store = vi.hoisted(() => ({
  state: {
    chatThemeSettings: {
      base: 'classic',
      presetId: 'preset:106',
      accentColor: 0x3390ec,
      messageColors: [0x5ca853],
    },
    setChatThemePreset: vi.fn(),
    setChatWallpaper: vi.fn(),
    resetChatWallpaper: vi.fn(),
  },
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: vi.fn(
    (selector: (state: typeof store.state) => unknown) => selector(store.state),
  ),
}));

vi.mock('../chat-color-picker', () => ({
  ChatColorPicker: () => <div data-testid="chat-color-picker" />,
}));

describe('ChatPanel', () => {
  it('uses the persisted bundle controls and does not render legacy bubble controls', async () => {
    const user = userEvent.setup();
    render(<ChatPanel />);

    await user.click(screen.getByRole('tab', { name: 'Day' }));

    expect(store.state.setChatThemePreset).toHaveBeenCalledWith('day', 'preset:101');
    expect(screen.getByTestId('chat-color-picker')).toBeInTheDocument();
    expect(screen.getByLabelText('Chat theme preview')).toBeInTheDocument();
    expect(screen.queryByText('Bubble Style')).not.toBeInTheDocument();
    expect(screen.queryByText('Fine Tuning')).not.toBeInTheDocument();
    expect(screen.queryByText('Visual Effects')).not.toBeInTheDocument();
  });

  it('selects and resets an original CGraph chat wallpaper', async () => {
    const user = userEvent.setup();
    render(<ChatPanel />);

    await user.click(screen.getByRole('button', { name: 'Contour' }));

    expect(store.state.setChatWallpaper).toHaveBeenCalledWith({
      intensity: 42,
      backgroundColor: 0xe2f1eb,
      secondBackgroundColor: 0xb6d5c9,
      thirdBackgroundColor: 0xd9e9d9,
      fourthBackgroundColor: 0xb0c9be,
      dark: false,
    });

    await user.click(screen.getByRole('button', { name: 'Reset chat wallpaper' }));
    expect(store.state.resetChatWallpaper).toHaveBeenCalledTimes(1);
  });
});
