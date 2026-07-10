import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import BubblesCustomization from './bubbles-customization';

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({
    theme: {
      chatBubbleStyle: 'default',
      chatBubbleColor: 'emerald',
      bubbleBorderRadius: 16,
      bubbleShadowIntensity: 30,
      bubbleGlassEffect: true,
      bubbleShowTail: true,
      bubbleHoverEffect: true,
      bubbleEntranceAnimation: 'fade',
    },
    setChatBubbleStyle: vi.fn(),
    updateTheme: vi.fn(),
  }),
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: () => vi.fn(),
}));

vi.mock('@/components/theme/theme-customizer/bubbles-tab', () => ({
  BubblesTab: () => <div data-testid="legacy-bubbles-tab" />,
}));

vi.mock('@/modules/settings/components/customize/panels/chat-color-picker', () => ({
  ChatColorPicker: () => <div data-testid="chat-color-picker" />,
}));

describe('BubblesCustomization', () => {
  it('mounts the global chat color picker on the routed Bubbles surface', () => {
    render(<BubblesCustomization />);

    expect(screen.getByTestId('chat-color-picker')).toBeInTheDocument();
    expect(screen.getByTestId('legacy-bubbles-tab')).toBeInTheDocument();
  });
});
