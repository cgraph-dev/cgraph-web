/**
 * Invite link creation tab component.
 */
import { useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClockIcon,
  PlusIcon,
  UserGroupIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { EXPIRATION_OPTIONS, MAX_USES_OPTIONS } from './useInviteManager';
import { FADE_UP } from '@/lib/animations/transitions';

interface InviteCreateTabProps {
  expiration: number | null;
  setExpiration: (val: number | null) => void;
  maxUses: number | null;
  setMaxUses: (val: number | null) => void;
  isGenerating: boolean;
  inviteLink: string;
  copied: boolean;
  onGenerate: () => void;
  onCopyLink: (link: string) => void;
}

/**
 */
/**
 * Invite Create Tab component.
 */
export function InviteCreateTab({
  expiration,
  setExpiration,
  maxUses,
  setMaxUses,
  isGenerating,
  inviteLink,
  copied,
  onGenerate,
  onCopyLink,
}: InviteCreateTabProps) {
  const expirationSelectId = useId();
  const maxUsesSelectId = useId();

  return (
    <motion.div
      key="create"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      {/* Settings */}
      <div className="mb-6 space-y-4">
        {/* Expiration */}
        <div>
          <label
            htmlFor={expirationSelectId}
            className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300"
          >
            <ClockIcon className="h-4 w-4" />
            Expire after
          </label>
          <select
            id={expirationSelectId}
            value={expiration ?? ''}
            onChange={(e) => setExpiration(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
          >
            {EXPIRATION_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Max Uses */}
        <div>
          <label
            htmlFor={maxUsesSelectId}
            className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300"
          >
            <UserGroupIcon className="h-4 w-4" />
            Max number of uses
          </label>
          <select
            id={maxUsesSelectId}
            value={maxUses ?? ''}
            onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
          >
            {MAX_USES_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onGenerate}
        disabled={isGenerating}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 font-semibold text-white disabled:opacity-50"
      >
        <PlusIcon className="h-5 w-5" />
        {isGenerating ? 'Generating...' : 'Generate New Link'}
      </motion.button>

      {/* Generated Link */}
      <AnimatePresence>
        {inviteLink && (
          <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} className="mt-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 rounded-xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] px-4 py-3 text-sm text-white"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onCopyLink(inviteLink)}
                aria-label="Copy generated invite link"
                className="rounded-xl bg-primary-600 p-3 text-white"
              >
                {copied ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <ClipboardDocumentIcon className="h-5 w-5" />
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
