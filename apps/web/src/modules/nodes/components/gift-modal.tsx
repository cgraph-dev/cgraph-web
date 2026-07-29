import { useState } from 'react';
import { CircleCheck, Gift, Send, X } from 'lucide-react';
import { FocusTrap } from '@/shared/components/accessibility';
import {
  Avatar,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Input,
  Textarea,
  toast,
} from '@/shared/components/ui';
import { useSendGift, useNodeWallet, useSpendableNodeBalance } from '../hooks/useNodes';
import { formatNodesToast, getNodesActionFeedback } from '../utils/nodes-error-feedback';
import { MIN_TIP, PLATFORM_CUT_PERCENT } from '@cgraph-dev/shared-types/nodes';

const MIN_GIFT = MIN_TIP;
const PLATFORM_CUT_RATIO = PLATFORM_CUT_PERCENT / 100;
const MAX_MESSAGE_LENGTH = 200;

interface GiftModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly recipientId: string;
  readonly recipientUsername: string;
  readonly recipientAvatarUrl: string | null;
}

export function GiftModal({
  isOpen,
  onClose,
  recipientId,
  recipientUsername,
  recipientAvatarUrl,
}: GiftModalProps) {
  const [amount, setAmount] = useState<number>(MIN_GIFT);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { data: wallet } = useNodeWallet();
  const spendableBalance = useSpendableNodeBalance(wallet);
  const giftMutation = useSendGift();

  if (!isOpen) return null;

  const available = spendableBalance;
  const belowMinimum = amount < MIN_GIFT;
  const platformCut = Math.floor(amount * PLATFORM_CUT_RATIO);
  const recipientReceives = amount - platformCut;
  const insufficientBalance = amount > available;
  const canSend = amount >= MIN_GIFT && !insufficientBalance;
  const amountError =
    belowMinimum && amount > 0
      ? `Minimum gift is ${MIN_GIFT} Nodes`
      : insufficientBalance
        ? `Insufficient balance (\u2115 ${available.toLocaleString()} available)`
        : undefined;

  function handleAmountChange(value: string): void {
    const parsed = parseInt(value, 10);
    setAmount(Number.isNaN(parsed) ? 0 : Math.max(0, parsed));
  }

  function handleSend(): void {
    const trimmedMessage = message.trim() || undefined;
    giftMutation.mutate(
      { recipientId, amount, message: trimmedMessage },
      {
        onSuccess: () => {
          setShowSuccess(true);
          toast.success(`Gifted \u2115 ${amount} to @${recipientUsername}`);
        },
        onError: (error) => {
          toast.error(formatNodesToast(getNodesActionFeedback(error, 'gift')));
        },
      }
    );
  }

  function handleClose(): void {
    setShowSuccess(false);
    setAmount(MIN_GIFT);
    setMessage('');
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <FocusTrap>
        <DialogContent className="max-w-sm" ariaLabelledBy="gift-dialog-title">
          <IconButton
            className="absolute right-3 top-3"
            icon={<X aria-hidden="true" />}
            label="Close gift dialog"
            onClick={handleClose}
          />

          {showSuccess ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div
                className="cgraph-card flex h-16 w-16 items-center justify-center text-[var(--token-feedback-success)]"
                data-cgraph-material="recessed"
                aria-hidden="true"
              >
                <CircleCheck className="h-8 w-8" />
              </div>
              <DialogTitle>
                <span id="gift-dialog-title">Gift sent</span>
              </DialogTitle>
              <p className="text-sm text-[var(--token-text-muted)]">
                @{recipientUsername} received {'\u2115'} {recipientReceives}
              </p>
              <Button className="mt-2 min-w-28" onClick={handleClose}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader className="pr-10">
                <div className="flex items-center gap-3">
                  <Gift
                    className="h-5 w-5 text-[var(--token-interactive-primary)]"
                    aria-hidden="true"
                  />
                  <div>
                    <DialogTitle>
                      <span id="gift-dialog-title">Gift Nodes to @{recipientUsername}</span>
                    </DialogTitle>
                    <DialogDescription>Add an optional note before sending.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div
                className="cgraph-card mt-4 flex items-center gap-3 p-3"
                data-cgraph-material="recessed"
              >
                <Avatar
                  src={recipientAvatarUrl}
                  name={recipientUsername}
                  alt={recipientUsername}
                  size="lg"
                />
                <div>
                  <p className="text-sm font-medium text-[var(--token-text-primary)]">
                    @{recipientUsername}
                  </p>
                  <p className="text-xs text-[var(--token-text-muted)]">Gift recipient</p>
                </div>
              </div>

              <div className="mt-4">
                <Input
                  id="gift-amount"
                  label={`Amount (minimum ${MIN_GIFT} Nodes)`}
                  type="number"
                  min={MIN_GIFT}
                  max={available}
                  value={amount}
                  onChange={(event) => handleAmountChange(event.target.value)}
                  error={amountError}
                  placeholder="Enter amount"
                />
              </div>

              <div className="mt-3">
                <Textarea
                  id="gift-message"
                  label="Message (optional)"
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))
                  }
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={2}
                  className="min-h-20 resize-none"
                  placeholder="Add a personal message..."
                  hint={`${message.length}/${MAX_MESSAGE_LENGTH}`}
                />
              </div>

              <div
                className="cgraph-card mt-3 space-y-2 p-3 text-sm text-[var(--token-text-muted)]"
                data-cgraph-material="recessed"
              >
                <div className="flex justify-between">
                  <span>Gift amount</span>
                  <span className="font-medium text-[var(--token-text-primary)]">
                    {'\u2115'} {amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee ({PLATFORM_CUT_PERCENT}%)</span>
                  <span>
                    -{'\u2115'} {platformCut}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[var(--product-line)] pt-2 font-medium">
                  <span>Recipient receives</span>
                  <span className="text-[var(--token-interactive-primary)]">
                    {'\u2115'} {recipientReceives}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-sm text-[var(--token-text-muted)]">
                Your balance: {'\u2115'} {available.toLocaleString()}
              </p>

              <DialogFooter>
                <Button variant="secondary" className="min-w-28 flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  className="min-w-28 flex-1"
                  leftIcon={<Send aria-hidden="true" />}
                  onClick={handleSend}
                  disabled={!canSend}
                  isLoading={giftMutation.isPending}
                >
                  {giftMutation.isPending ? 'Sending\u2026' : 'Send Gift'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </FocusTrap>
    </Dialog>
  );
}
