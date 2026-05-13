/**
 * ChannelItem component
 */

import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { springs } from '@/lib/animation-presets';
import {
  HashtagIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getGroupChannelRouteForChannel } from '@/modules/groups/routing';
import type { ChannelItemProps } from './types';

/**
 */
/**
 * Channel Item component.
 */
export function ChannelItem({ channel, groupId, isActive }: ChannelItemProps) {
  const getIcon = () => {
    switch (channel.type) {
      case 'voice':
        return SpeakerWaveIcon;
      case 'video':
        return VideoCameraIcon;
      case 'announcement':
        return MegaphoneIcon;
      case 'forum':
        return ChatBubbleLeftRightIcon;
      default:
        return HashtagIcon;
    }
  };

  const Icon = getIcon();

  return (
    <NavLink
      to={getGroupChannelRouteForChannel(groupId, channel)}
      onClick={() => HapticFeedback.light()}
      className="relative mx-2"
    >
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={`relative z-10 flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-all ${
          isActive
            ? 'bg-primary-500/10 text-primary-300 shadow-[0_4px_16px_rgba(0,0,0,0.2),color-mix(in_srgb,var(--color-brand-purple)_16%,transparent)_0px_1px_1px_inset] border border-primary-500/20'
            : 'text-white/50 hover:bg-[var(--token-bg-primary)/0.3] hover:text-white/80 border border-transparent'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId={`activeChannel-${groupId}`}
            className="absolute -left-2 top-1/2 h-full w-[3px] -translate-y-1/2 rounded-r-full bg-primary-400 shadow-[0_0_10px_color-mix(in_srgb,var(--color-brand-purple)_35%,transparent)]"
            transition={springs.bouncy}
          />
        )}
        <Icon
          className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-300' : ''}`}
        />
        <span
          className={`truncate text-[13px] ${isActive ? 'font-semibold' : 'font-medium'}`}
        >
          {channel.name}
        </span>
        <AnimatePresence>
          {channel.unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={springs.bouncy}
              className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white/[0.1] border border-white/20 px-1 text-[10px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.5),rgba(255,255,255,0.1)_0px_1px_1px_inset]"
            >
              {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </NavLink>
  );
}
