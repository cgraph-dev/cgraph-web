import type { ReactNode, RefObject, UIEventHandler } from 'react';
import { motion } from 'motion/react';
import { tweens } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';

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
}: ConversationSurfaceProps) {
  return (
    <motion.div
      className="relative flex h-full max-h-screen flex-1 flex-col overflow-hidden"
      {...FADE_IN}
      transition={tweens.smooth}
    >
      {header}
      {pinnedPanel}
      {requestBanner}

      <div
        ref={messagesScrollRef}
        onScroll={onMessagesScroll}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6"
        aria-label="Conversation messages"
      >
        {messages}
      </div>

      {scrollControl}
      {composer}
      {modalLayer}
    </motion.div>
  );
}

export default ConversationSurface;
