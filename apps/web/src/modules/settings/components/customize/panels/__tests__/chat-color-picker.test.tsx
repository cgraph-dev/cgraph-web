import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatColorPicker } from '../chat-color-picker';

const store = vi.hoisted(() => ({
  state: {
    defaultConversationColor: { color: 'ultramarine' },
    customChatColors: { colors: {}, version: 1, order: [] as string[] },
    conversationChatThemeOverrides: {} as Record<string, unknown>,
    setDefaultConversationColor: vi.fn(),
    setConversationChatThemeColor: vi.fn(),
    addCustomChatColor: vi.fn(),
    editCustomChatColor: vi.fn(),
    removeCustomChatColor: vi.fn(),
    resetDefaultConversationColor: vi.fn(),
    resetConversationChatThemeColor: vi.fn(),
    resetAllConversationChatThemeColors: vi.fn(),
  },
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: Object.assign(
    vi.fn((selector: (state: typeof store.state) => unknown) => selector(store.state)),
    { getState: () => store.state },
  ),
}));

describe('ChatColorPicker', () => {
  beforeEach(() => {
    store.state.defaultConversationColor = { color: 'ultramarine' };
    store.state.customChatColors = { colors: {}, version: 1, order: [] };
    store.state.conversationChatThemeOverrides = {};
    vi.clearAllMocks();
  });

  it('renders every shared color as an accessible global swatch', async () => {
    const user = userEvent.setup();
    render(<ChatColorPicker />);

    expect(screen.getByRole('listbox', { name: 'Chat colors' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(22);

    await user.click(screen.getByRole('option', { name: 'crimson' }));

    expect(store.state.setDefaultConversationColor).toHaveBeenCalledWith('crimson');
  });

  it('creates a solid custom color through the editor', async () => {
    const user = userEvent.setup();
    render(<ChatColorPicker />);

    await user.click(screen.getByRole('button', { name: 'Create custom color' }));
    fireEvent.change(screen.getByLabelText('Start color hue'), { target: { value: '180' } });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(store.state.addCustomChatColor).toHaveBeenCalledWith(
      { start: { hue: 180, saturation: 84 }, deg: 180 },
      undefined,
    );
  });

  it('keeps custom options and selected-color commands in separate accessible controls', async () => {
    const user = userEvent.setup();
    const customColor = { start: { hue: 220, saturation: 84 }, deg: 180 };
    Object.assign(store.state, {
      defaultConversationColor: {
        color: 'custom',
        customColorData: { id: 'custom-1', value: customColor },
      },
      customChatColors: {
        colors: { 'custom-1': customColor },
        version: 1,
        order: ['custom-1'],
      },
    });

    render(<ChatColorPicker />);

    expect(screen.getByRole('listbox', { name: 'Chat colors' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Custom chat colors' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Selected custom color actions' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Duplicate custom color' }));

    expect(store.state.addCustomChatColor).toHaveBeenCalledWith(customColor, undefined);
  });

  it('uses the conversation action and exposes a conversation reset', async () => {
    const user = userEvent.setup();
    store.state.conversationChatThemeOverrides = {
      'conversation-1': { conversationColor: 'teal' },
    };

    render(<ChatColorPicker conversationId="conversation-1" />);

    await user.click(screen.getByRole('option', { name: 'violet' }));
    await user.click(screen.getByRole('button', { name: 'Reset conversation color' }));

    expect(store.state.setConversationChatThemeColor).toHaveBeenCalledWith(
      'conversation-1',
      'violet',
    );
    expect(store.state.resetConversationChatThemeColor).toHaveBeenCalledWith('conversation-1');
  });

  it('does not expose a color reset when the conversation only overrides wallpaper', () => {
    store.state.conversationChatThemeOverrides = {
      'conversation-1': {
        wallpaper: {
          intensity: 36,
          backgroundColor: 0x192436,
          secondBackgroundColor: 0x284b5c,
          thirdBackgroundColor: 0x263848,
          fourthBackgroundColor: 0x131b2a,
          dark: true,
        },
      },
    };

    render(<ChatColorPicker conversationId="conversation-1" />);

    expect(screen.queryByRole('button', { name: 'Reset conversation color' })).not.toBeInTheDocument();
  });
});
