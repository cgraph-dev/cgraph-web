import { memo } from 'react';
import type { ChatThemePreviewStyle } from './chat-panel.constants';

interface ChatBubbleDemoProps {
  readonly isOwn: boolean;
  readonly message: string;
  readonly themePreview: ChatThemePreviewStyle;
}

export const ChatBubbleDemo = memo(function ChatBubbleDemo({
  isOwn,
  message,
  themePreview,
}: ChatBubbleDemoProps) {
  const bubbleStyle = isOwn
    ? themePreview.outgoingBubbleStyle
    : themePreview.incomingBubbleStyle;

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
    >
      <div
        className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
        data-chat-theme-preview-bubble={isOwn ? 'outgoing' : 'incoming'}
        style={bubbleStyle}
      >
        {message}
      </div>
    </div>
  );
});
