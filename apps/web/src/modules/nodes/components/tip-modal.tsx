import { useState } from 'react';
import { Coins, Send, X } from 'lucide-react';
import { FocusTrap } from '@/shared/components/accessibility';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Input,
  toast,
} from '@/shared/components/ui';
import { useSendTip, useNodeWallet, useSpendableNodeBalance } from '../hooks/useNodes';
import { formatNodesToast, getNodesActionFeedback } from '../utils/nodes-error-feedback';
import { MIN_TIP } from '@cgraph-dev/shared-types/nodes';

interface TipModalProps {
  recipientId: string;
  recipientName: string;
  isOpen: boolean;
  onClose: () => void;
  context?: 'dm' | 'profile' | 'forum';
}

const PRESETS = [10, 50, 100, 500] as const;

export function TipModal({
  recipientId,
  recipientName,
  isOpen,
  onClose,
  context: _context,
}: TipModalProps) {
  const [amount, setAmount] = useState<number>(PRESETS[0]);
  const [customMode, setCustomMode] = useState(false);
  const { data: wallet } = useNodeWallet();
  const spendableBalance = useSpendableNodeBalance(wallet);
  const tipMutation = useSendTip();

  if (!isOpen) return null;

  const available = spendableBalance;
  const belowMinimum = amount < MIN_TIP;
  const canTip = amount >= MIN_TIP && amount <= available;
  const creatorReceives = Math.floor(amount * 0.8);
  const amountError = belowMinimum
    ? `Minimum tip is ${MIN_TIP} Nodes`
    : amount > available
      ? `Insufficient balance (${available.toLocaleString()} available)`
      : undefined;

  const handleSend = () => {
    tipMutation.mutate(
      { recipientId, amount },
      {
        onSuccess: () => {
          toast.success(`Tipped \u2115 ${amount} to @${recipientName}`);
          onClose();
        },
        onError: (error) => {
          toast.error(formatNodesToast(getNodesActionFeedback(error, 'tip')));
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <FocusTrap>
        <DialogContent className="max-w-sm" ariaLabelledBy="tip-dialog-title">
          <IconButton
            className="absolute right-3 top-3"
            icon={<X aria-hidden="true" />}
            label="Close tip dialog"
            onClick={onClose}
          />
          <DialogHeader className="pr-10">
            <div className="flex items-center gap-3">
              <Coins
                className="h-5 w-5 text-[var(--token-interactive-primary)]"
                aria-hidden="true"
              />
              <div>
                <DialogTitle>
                  <span id="tip-dialog-title">Tip @{recipientName}</span>
                </DialogTitle>
                <DialogDescription>Choose how many Nodes to send.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-4 gap-2" aria-label="Tip amount">
            {PRESETS.map((preset) => {
              const selected = !customMode && amount === preset;
              return (
                <Button
                  key={preset}
                  variant={selected ? 'primary' : 'secondary'}
                  size="sm"
                  className="min-w-0 px-2"
                  aria-pressed={selected}
                  animated={false}
                  onClick={() => {
                    setAmount(preset);
                    setCustomMode(false);
                  }}
                >
                  {'\u2115'} {preset}
                </Button>
              );
            })}
          </div>

          <Button
            variant={customMode ? 'primary' : 'secondary'}
            className="mt-2"
            fullWidth
            aria-pressed={customMode}
            animated={false}
            onClick={() => setCustomMode(true)}
          >
            Custom Amount
          </Button>

          {customMode && (
            <Input
              className="mt-2"
              label="Custom amount"
              type="number"
              min={1}
              max={available}
              value={amount}
              onChange={(event) =>
                setAmount(Math.max(0, Number.parseInt(event.target.value, 10) || 0))
              }
              error={amountError}
              placeholder="Enter amount"
              autoFocus
            />
          )}

          <div
            className="cgraph-card mt-4 space-y-2 p-3 text-sm"
            data-cgraph-material="recessed"
          >
            <div className="flex justify-between gap-4 text-[var(--token-text-muted)]">
              <span>Creator receives</span>
              <span className="font-medium text-[var(--token-text-primary)]">
                {'\u2115'} {creatorReceives} (80%)
              </span>
            </div>
            <div className="flex justify-between gap-4 text-[var(--token-text-muted)]">
              <span>Your balance</span>
              <span className="font-medium text-[var(--token-text-primary)]">
                {'\u2115'} {available.toLocaleString()}
              </span>
            </div>
            {!customMode && amountError && (
              <p className="text-sm text-[var(--token-feedback-error)]">{amountError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" className="min-w-28 flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="min-w-28 flex-1"
              leftIcon={<Send aria-hidden="true" />}
              isLoading={tipMutation.isPending}
              disabled={!canTip}
              onClick={handleSend}
            >
              {tipMutation.isPending ? 'Sending…' : `Send \u2115 ${amount}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </FocusTrap>
    </Dialog>
  );
}
