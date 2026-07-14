import type { ReactNode, RefObject, UIEventHandler } from 'react';
import type { ChatThemeAppearance } from '@/modules/chat/theme/chat-theme-appearance';

export interface ConversationSurfaceProps {
  readonly header: ReactNode;
  readonly messages: ReactNode;
  readonly composer: ReactNode;
  readonly messagesScrollRef: RefObject<HTMLDivElement | null>;
  readonly onMessagesScroll: UIEventHandler<HTMLDivElement>;
  readonly pinnedPanel?: ReactNode;
  readonly requestBanner?: ReactNode;
  readonly scrollControl?: ReactNode;
  readonly modalLayer?: ReactNode;
  readonly chatThemeAppearance?: ChatThemeAppearance;
}

/**
 * Shared conversation frame for route-owned chat surfaces.
 *
 * Routes provide data-bound slots; the shell owns the stable header/message/composer layout.
 */
export function ConversationSurface({
  header,
  messages,
  composer,
  messagesScrollRef,
  onMessagesScroll,
  pinnedPanel,
  requestBanner,
  scrollControl,
  modalLayer,
  chatThemeAppearance,
}: ConversationSurfaceProps) {
  return (
    <div
      data-testid="conversation-surface"
      className="relative flex h-full min-h-0 max-h-screen flex-1 flex-col overflow-hidden bg-[var(--token-bg-primary)]"
    >
      {header}
      {pinnedPanel}
      {requestBanner}

      <div
        ref={messagesScrollRef}
        onScroll={onMessagesScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5"
        aria-label="Conversation messages"
        data-chat-theme-base={chatThemeAppearance?.base}
        data-chat-conversation-color={chatThemeAppearance?.conversationColor}
        style={chatThemeAppearance?.surfaceStyle}
      >
        {messages}
      </div>

      {scrollControl}
      {composer}
      {modalLayer}
    </div>
  );
}

export default ConversationSurface;
