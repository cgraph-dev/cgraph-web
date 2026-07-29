import { useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { Button, GlassCard, toast } from '@/shared/components/ui';
import { useUnlockContent } from '@/modules/nodes/hooks/useNodes';
import { formatNodesToast, getNodesActionFeedback } from '@/modules/nodes/utils/nodes-error-feedback';

export interface ContentUnlockOverlayProps {
  postId: string;
  price: number;
  onUnlocked?: () => void;
}

export function ContentUnlockOverlay({ postId, price, onUnlocked }: ContentUnlockOverlayProps) {
  const navigate = useNavigate();
  const unlockMutation = useUnlockContent();

  const handleUnlock = () => {
    unlockMutation.mutate(
      { threadId: postId, amount: price },
      {
        onSuccess: () => {
          toast.success('Content unlocked!');
          onUnlocked?.();
        },
        onError: (error) => {
          const feedback = getNodesActionFeedback(error, 'contentUnlock');

          if (feedback.alreadyComplete) {
            toast.success('Content already unlocked');
            onUnlocked?.();
            return;
          }

          if (feedback.shouldOpenShop) {
            toast.error(feedback.title);
            navigate('/me/wallet/shop');
          } else {
            toast.error(formatNodesToast(feedback));
          }
        },
      }
    );
  };

  return (
    <GlassCard variant="frosted" className="mb-4 p-6 text-center">
      <div className="flex flex-col items-center gap-3 py-4">
        <div
          className="cgraph-card flex h-12 w-12 items-center justify-center text-[var(--token-interactive-primary)]"
          data-cgraph-material="recessed"
          aria-hidden="true"
        >
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--token-text-primary)]">Content Gated</h3>
        <p className="max-w-sm text-sm text-[var(--token-text-muted)]">
          This thread's full content is gated. Unlock it to read the complete post and join the
          discussion.
        </p>
        <Button
          className="mt-2"
          isLoading={unlockMutation.isPending}
          onClick={handleUnlock}
        >
          {unlockMutation.isPending ? 'Unlocking…' : `Unlock for ${price ?? '?'} Nodes`}
        </Button>
      </div>
    </GlassCard>
  );
}
