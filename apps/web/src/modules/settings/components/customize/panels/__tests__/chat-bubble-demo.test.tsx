import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { chatThemeSettingsToPreviewStyle } from '../chat-panel.constants';
import { ChatBubbleDemo } from '../chat-bubble-demo';

describe('ChatBubbleDemo', () => {
  it('renders the supplied chat-theme bundle without legacy preference state', () => {
    const themePreview = chatThemeSettingsToPreviewStyle({
      base: 'tinted',
      presetId: 'preset:10',
      accentColor: 0x0088ff,
      messageColors: [0x517893, 0x285c96],
    });

    render(
      <ChatBubbleDemo
        isOwn
        message="Send it to the node."
        themePreview={themePreview}
      />,
    );

    expect(screen.getByText('Send it to the node.')).toHaveAttribute(
      'data-chat-theme-preview-bubble',
      'outgoing',
    );
    expect(screen.getByText('Send it to the node.')).toHaveStyle({
      background: 'linear-gradient(135deg, #517893, #285c96)',
      color: '#f8fafc',
    });
  });
});
