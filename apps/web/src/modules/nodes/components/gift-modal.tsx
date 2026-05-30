/**
 * Gift modal -- send Nodes as a gift to a friend with an optional message.
 *
 * 20% platform cut, minimum 10 Nodes.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GiftIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { FocusTrap } from '@/shared/components/accessibility';
import { useSendGift, useNodeWallet } from '../hooks/useNodes';
import { formatNodesToast, getNodesActionFeedback } from '../utils/nodes-error-feedback';
import { MIN_TIP, PLATFORM_CUT_PERCENT } from '@cgraph-dev/shared-types/nodes';
import toast from 'react-hot-toast';

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

/** Gift modal -- lets the user send Nodes as a gift to a friend. */
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
  const giftMutation = useSendGift();

  if (!isOpen) return null;

  const available = wallet?.available_balance ?? 0;
  const belowMinimum = amount < MIN_GIFT;
  const platformCut = Math.floor(amount * PLATFORM_CUT_RATIO);
  const recipientReceives = amount - platformCut;
  const insufficientBalance = amount > available;
  const canSend = amount >= MIN_GIFT && !insufficientBalance;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Gift Nodes to ${recipientUsername}`}
    >
      <FocusTrap>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          data-close
          className="absolute right-3 top-3 rounded-md p-1 text-zinc-500 hover:text-zinc-300"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              <div className="relative">
                <CheckCircleIcon className="h-16 w-16 text-violet-400" />
                {/* Confetti-like sparkle dots */}
                <span className="absolute -right-1 -top-1 h-2 w-2 animate-ping rounded-full bg-violet-400" />
                <span className="absolute -left-2 top-3 h-1.5 w-1.5 animate-ping rounded-full bg-fuchsia-400 delay-100" />
                <span className="absolute bottom-0 right-1 h-1.5 w-1.5 animate-ping rounded-full bg-pink-400 delay-200" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Gift sent!</h3>
              <p className="text-sm text-zinc-400">
                @{recipientUsername} received {'\u2115'} {recipientReceives}
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-2 rounded-lg bg-violet-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
              >
                Done
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <GiftIcon className="h-6 w-6 text-violet-400" />
                <h3 className="text-base font-bold text-zinc-100">
                  Gift Nodes to @{recipientUsername}
                </h3>
              </div>

              {/* Recipient info */}
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-zinc-800/60 p-3">
                {recipientAvatarUrl ? (
                  <img
                    src={recipientAvatarUrl}
                    alt={recipientUsername}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-violet-600/30 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-violet-300">
                    {recipientUsername.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-zinc-200">@{recipientUsername}</p>
                  <p className="text-xs text-zinc-500">Will receive your gift</p>
                </div>
              </div>

              {/* Amount input */}
              <div className="mt-4">
                <label
                  htmlFor="gift-amount"
                  className="mb-1 block text-xs font-medium text-zinc-400"
                >
                  Amount (min {MIN_GIFT} Nodes)
                </label>
                <input
                  id="gift-amount"
                  type="number"
                  min={MIN_GIFT}
                  max={available}
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
                  placeholder="Enter amount"
                />
              </div>

              {/* Optional message */}
              <div className="mt-3">
                <label
                  htmlFor="gift-message"
                  className="mb-1 block text-xs font-medium text-zinc-400"
                >
                  Message (optional)
                </label>
                <textarea
                  id="gift-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
                  placeholder="Add a personal message..."
                />
                <p className="mt-0.5 text-right text-xs text-zinc-600">
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </p>
              </div>

              {/* Fee breakdown */}
              <div className="mt-3 space-y-1 rounded-lg bg-zinc-800/40 p-3 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Gift amount</span>
                  <span className="text-zinc-200">
                    {'\u2115'} {amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee ({PLATFORM_CUT_PERCENT}%)</span>
                  <span className="text-zinc-400">
                    -{'\u2115'} {platformCut}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-700 pt-1 font-medium">
                  <span>Recipient receives</span>
                  <span className="text-violet-300">
                    {'\u2115'} {recipientReceives}
                  </span>
                </div>
              </div>

              {/* Validation messages */}
              {belowMinimum && amount > 0 && (
                <p className="mt-2 text-xs text-red-400">Minimum gift is {MIN_GIFT} Nodes</p>
              )}
              {insufficientBalance && !belowMinimum && (
                <p className="mt-2 text-xs text-red-400">
                  Insufficient balance ({'\u2115'} {available.toLocaleString()} available)
                </p>
              )}

              {/* Balance display */}
              <p className="mt-2 text-xs text-zinc-500">
                Your balance: {'\u2115'} {available.toLocaleString()}
              </p>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend || giftMutation.isPending}
                  className={cn(
                    'flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors',
                    'hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500'
                  )}
                >
                  {giftMutation.isPending ? 'Sending\u2026' : `Send Gift`}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </FocusTrap>
    </div>
  );
}
