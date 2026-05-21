/**
 * ContentArea component
 */

import { motion } from 'motion/react';
import { useOutlet } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import type { ContentAreaProps } from './types';
import { tweens, loop, springs } from '@/lib/animation-presets';

const ambientParticles = [
  { left: '16%', top: '18%', delay: 0 },
  { left: '28%', top: '72%', delay: 0.4 },
  { left: '42%', top: '28%', delay: 0.9 },
  { left: '58%', top: '78%', delay: 1.3 },
  { left: '74%', top: '22%', delay: 1.8 },
  { left: '84%', top: '64%', delay: 2.2 },
] as const;

function GroupSelectionState({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <motion.div
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-transparent px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={tweens.smooth}
      role="status"
      aria-label={title}
    >
      {ambientParticles.map((particle) => (
        <motion.div
          key={`${particle.left}-${particle.top}`}
          className="absolute h-1 w-1 rounded-full bg-primary-400"
          style={{ left: particle.left, top: particle.top, opacity: 0.12 }}
          animate={{
            y: [0, -36, 0],
            opacity: [0.1, 0.28, 0.1],
            scale: [1, 1.45, 1],
          }}
          transition={{ ...loop(tweens.ambient), delay: particle.delay }}
        />
      ))}

      <motion.div
        className="relative z-10 text-center"
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={springs.dramatic}
      >
        <div className="relative mb-6 inline-block">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/20 via-indigo-500/20 to-cyan-500/20 shadow-2xl backdrop-blur-sm">
            <UserGroupIcon className="h-12 w-12 text-primary-300" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-400/20 to-cyan-400/20"
            animate={{
              scale: [1, 1.26, 1],
              opacity: [0.48, 0, 0.48],
              rotate: [0, 180, 360],
            }}
            transition={loop(tweens.glacial)}
          />
          <motion.div
            className="absolute -inset-4 rounded-3xl border border-primary-400/20"
            animate={{
              scale: [1, 1.42, 1],
              opacity: [0.28, 0, 0.28],
            }}
            transition={{ ...loop(tweens.decorative), delay: 0.45 }}
          />
        </div>

        <h3 className="mb-3 flex items-center justify-center gap-2 bg-gradient-to-r from-white via-primary-200 to-cyan-200 bg-clip-text text-3xl font-bold text-transparent">
          {title}
          <SparklesIcon className="h-6 w-6 animate-pulse text-primary-400" />
        </h3>
        <p className="mx-auto max-w-md text-lg text-gray-400">{description}</p>

        <motion.div
          className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={loop(tweens.ambient)}
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4 text-primary-500" />
          {status}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Content Area component.
 */
export function ContentArea({ activeGroup, groupId, channelId }: ContentAreaProps) {
  const outlet = useOutlet();

  if (outlet) {
    return outlet;
  }

  // Has channel selected
  if (channelId) {
    return null;
  }

  // Has group selected but no channel
  if (groupId) {
    return (
      <GroupSelectionState
        title={activeGroup?.name ? `Welcome to ${activeGroup.name}` : 'Your Groups'}
        description="Select a channel to start chatting with this community."
        status="Community channels"
      />
    );
  }

  // No group selected
  return (
    <GroupSelectionState
      title="Your Groups"
      description="Select a server from the sidebar or create a new one to get started."
      status="Group chat ready"
    />
  );
}
