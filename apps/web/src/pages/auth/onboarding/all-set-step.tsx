/**
 * AllSetStep component - final onboarding step with summary
 *
 * Shows a celebratory message and "Go to Home" prompt.
 */

import { motion } from 'motion/react';
import { containerVariants, itemVariants } from './animations';

/**
 * Final onboarding step — "You're all set!"
 */
export function AllSetStep() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 text-center"
    >
      {/* Celebration icon */}
      <motion.div
        variants={itemVariants}
        className="from-primary-500/20 to-purple-500/20 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br"
      >
        <span className="text-4xl">&#127881;</span>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="text-xl font-bold text-foreground">You&apos;re All Set!</h3>
        <p className="mt-2 text-foreground-secondary">
          Your profile is ready. Start chatting, explore communities, and make CGraph your own.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-3">
        <div className="rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">&#128172;</span>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Encrypted Messaging</p>
              <p className="text-xs text-foreground-muted">
                End-to-end encrypted on mobile and desktop
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">&#128101;</span>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Communities</p>
              <p className="text-xs text-foreground-muted">
                Join groups and forums to connect with others
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">&#127942;</span>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Earn Rewards</p>
              <p className="text-xs text-foreground-muted">
                Gain XP, unlock achievements, and earn Nodes
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
