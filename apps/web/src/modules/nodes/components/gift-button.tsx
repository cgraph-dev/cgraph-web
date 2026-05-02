/**
 * Gift button -- opens the gift modal to send Nodes as a gift.
 */
import { useState } from 'react';
import { GiftIcon } from '@heroicons/react/24/outline';
import { GiftModal } from './gift-modal';

interface GiftButtonProps {
  readonly recipientId: string;
  readonly recipientUsername: string;
  readonly recipientAvatarUrl: string | null;
  readonly className?: string;
}

/** Gift button that opens the gift modal for sending Nodes to a friend. */
export function GiftButton({
  recipientId,
  recipientUsername,
  recipientAvatarUrl,
  className,
}: GiftButtonProps) {
  const [showGift, setShowGift] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGift(true)}
        className={
          className ??
          'hover:bg-violet-500/10 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300'
        }
        title={`Gift Nodes to @${recipientUsername}`}
      >
        <GiftIcon className="h-3.5 w-3.5" />
        Gift Nodes
      </button>

      <GiftModal
        isOpen={showGift}
        onClose={() => setShowGift(false)}
        recipientId={recipientId}
        recipientUsername={recipientUsername}
        recipientAvatarUrl={recipientAvatarUrl}
      />
    </>
  );
}
