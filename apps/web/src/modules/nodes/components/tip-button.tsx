import { useState } from 'react';
import { Coins } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { TipModal } from './tip-modal';

interface TipButtonProps {
  recipientId: string;
  recipientName: string;
  className?: string;
}

export function TipButton({ recipientId, recipientName, className }: TipButtonProps) {
  const [showTip, setShowTip] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Coins aria-hidden="true" />}
        onClick={() => setShowTip(true)}
        className={className}
        title={`Tip @${recipientName}`}
      >
        Tip
      </Button>

      <TipModal
        recipientId={recipientId}
        recipientName={recipientName}
        isOpen={showTip}
        onClose={() => setShowTip(false)}
      />
    </>
  );
}
