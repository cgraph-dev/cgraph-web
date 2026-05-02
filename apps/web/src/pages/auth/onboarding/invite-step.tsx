/**
 * InviteStep component - generate and share platform invite link
 *
 * Fetches or creates an invite code on mount, displays a shareable
 * link with copy-to-clipboard and native Web Share API support.
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { containerVariants, itemVariants } from './animations';
import { apiClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('InviteStep');

const INVITE_BASE_URL = `${window.location.origin}/invite/`;

interface InviteData {
  readonly code: string;
  readonly uses: number;
  readonly max_uses: number;
}

/**
 * Invite friends onboarding step with shareable link.
 */
export function InviteStep() {
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchOrCreateInvite() {
      try {
        // Try to get existing invites first
        const listResult = await apiClient.invites.list();
        if (listResult.ok && listResult.data.length > 0) {
          const [first] = listResult.data;
          if (first) {
            setInvite({ code: first.code, uses: first.uses, max_uses: first.max_uses });
          }
          return;
        }

        // Create a new one
        const createResult = await apiClient.invites.create();
        if (createResult.ok) {
          const inv = createResult.data;
          setInvite({ code: inv.code, uses: inv.uses, max_uses: inv.max_uses });
        }
      } catch (error) {
        logger.error('Failed to load invite', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrCreateInvite();
  }, []);

  function handleCopy() {
    if (!invite) return;

    const link = `${INVITE_BASE_URL}${invite.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleShare() {
    if (!invite) return;

    const link = `${INVITE_BASE_URL}${invite.code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on CGraph',
          text: 'Check out CGraph - a secure messaging and community platform!',
          url: link,
        });
      } catch {
        // User cancelled share dialog
      }
    } else {
      handleCopy();
    }
  }

  const inviteLink = invite ? `${INVITE_BASE_URL}${invite.code}` : '';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.p variants={itemVariants} className="text-center text-foreground-secondary">
        Share your invite link and earn 50 Nodes for each friend who joins
      </motion.p>

      {isLoading ? (
        <motion.div variants={itemVariants} className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </motion.div>
      ) : invite ? (
        <>
          {/* Invite link display */}
          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-4"
          >
            <p className="mb-2 text-xs font-medium text-foreground-muted">Your invite link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-[var(--token-bg-primary)] px-3 py-2 text-sm text-foreground">
                {inviteLink}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="bg-primary-500/20 hover:bg-primary-500/30 flex-shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-primary-400 transition-all"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </motion.div>

          {/* Share button */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <button
              type="button"
              onClick={handleShare}
              className="from-primary-500/20 to-purple-500/20 hover:from-primary-500/30 hover:to-purple-500/30 flex items-center gap-2 rounded-xl bg-gradient-to-r px-6 py-3 font-medium text-primary-400 transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share with friends
            </button>
          </motion.div>

          {/* Reward info */}
          <motion.div
            variants={itemVariants}
            className="border-primary-500/20 bg-primary-500/5 rounded-xl border p-4 text-center"
          >
            <p className="text-sm text-primary-400">
              Earn <span className="font-bold">50 Nodes</span> for each friend who signs up
            </p>
            <p className="mt-1 text-xs text-foreground-muted">
              {invite.uses} of {invite.max_uses} invites used
            </p>
          </motion.div>
        </>
      ) : (
        <motion.p variants={itemVariants} className="py-8 text-center text-sm text-gray-500">
          Could not generate invite link. You can invite friends later from Settings.
        </motion.p>
      )}
    </motion.div>
  );
}
