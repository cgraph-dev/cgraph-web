/**
 * Animation Presets - Chat Bubble Animations
 *
 * Chat bubble animation configurations for different bubble styles.
 */

import { durations, springs as sharedSprings, stagger } from '@cgraph/animation-constants';
import {
  normalizeChatBubbleAnimationId,
  type ChatBubbleAnimationId,
  type ChatBubbleLegacyStyleId,
} from '@cgraph/design-tokens';
import { type Transition, type TargetAndTransition } from 'motion/react';

import { springs } from './presets';

// CHAT BUBBLE ANIMATIONS BY STYLE

export type ChatBubbleStyleId = ChatBubbleLegacyStyleId;

type ChatBubbleAnimationFactory = (
  isOwn: boolean,
  delay: number
) => {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
};

const canonicalChatBubbleAnimations: Record<ChatBubbleAnimationId, ChatBubbleAnimationFactory> = {
  rounded: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.bouncy },
  }),
  sharp: (isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, x: isOwn ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    transition: { delay, ...springs.snappy },
  }),
  cloud: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.5, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
  minimal: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay, duration: durations.slow.ms / 1000 },
  }),
  modern: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 15, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { delay, duration: durations.slower.ms / 1000, ease: [0.4, 0, 0.2, 1] },
  }),
  retro: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, rotateX: -90 },
    animate: { opacity: 1, rotateX: 0 },
    transition: { delay, ...springs.dramatic },
  }),
  default: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, ...springs.default },
  }),
  glass: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 12, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { delay, duration: durations.slower.ms / 1000, ease: [0.4, 0, 0.2, 1] },
  }),
  neon: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.8, filter: 'blur(8px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    transition: { delay, ...springs.bouncy },
  }),
  outline: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: durations.normal.ms / 1000 },
  }),
  'three-d': (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, rotateX: -35, scale: 0.9 },
    animate: { opacity: 1, rotateX: 0, scale: 1 },
    transition: { delay, ...springs.dramatic },
  }),
  pill: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.5, borderRadius: '0px' },
    animate: { opacity: 1, scale: 1, borderRadius: '9999px' },
    transition: { delay, ...springs.bouncy },
  }),
  asymmetric: (isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, x: isOwn ? 30 : -30 },
    animate: { opacity: 1, x: 0 },
    transition: { delay, ...springs.snappy },
  }),
  aero: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.7, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
  flat: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: durations.normal.ms / 1000 },
  }),
  compact: (_isOwn: boolean, delay: number) => ({
    initial: { opacity: 0, scale: 0.9, y: 5 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay, ...springs.gentle },
  }),
};

export const chatBubbleAnimations: Record<string, ChatBubbleAnimationFactory> = {
  ...canonicalChatBubbleAnimations,
  'bubble-default': canonicalChatBubbleAnimations.rounded,
  'bubble-pill': canonicalChatBubbleAnimations.pill,
  'bubble-sharp': canonicalChatBubbleAnimations.sharp,
  'bubble-asymmetric': canonicalChatBubbleAnimations.asymmetric,
  'bubble-aero': canonicalChatBubbleAnimations.aero,
  'bubble-flat': canonicalChatBubbleAnimations.flat,
  'bubble-compact': canonicalChatBubbleAnimations.compact,
  'bubble-retro': canonicalChatBubbleAnimations.retro,
  'bubble-neon': canonicalChatBubbleAnimations.neon,
  'bubble-minimal': canonicalChatBubbleAnimations.minimal,
  'bubble-cloud': canonicalChatBubbleAnimations.cloud,
  'bubble-modern': canonicalChatBubbleAnimations.modern,
  'bubble-glass': canonicalChatBubbleAnimations.glass,
  'bubble-outline': canonicalChatBubbleAnimations.outline,
  'bubble-3d': canonicalChatBubbleAnimations['three-d'],
};

export function getChatBubbleAnimation(styleId: string, isOwn: boolean, delay: number) {
  return canonicalChatBubbleAnimations[normalizeChatBubbleAnimationId(styleId)](isOwn, delay);
}

// DIRECTIONAL ENTRANCE VARIANTS

/** Message entrance variant — direction-aware slide + fade */
export const messageEntranceVariants = {
  /** Sent message (slides from right) */
  sent: {
    initial: { opacity: 0, x: 20, scale: 0.97 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: {
      type: 'spring' as const,
      stiffness: sharedSprings.snappy.stiffness,
      damping: sharedSprings.snappy.damping,
    },
  },
  /** Received message (slides from left) */
  received: {
    initial: { opacity: 0, x: -20, scale: 0.97 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: {
      type: 'spring' as const,
      stiffness: sharedSprings.snappy.stiffness,
      damping: sharedSprings.snappy.damping,
    },
  },
} as const;

/** Stagger container for batch message arrivals */
export const messageListStagger = {
  animate: {
    transition: {
      staggerChildren: stagger.fast.staggerChildren,
    },
  },
} as const;

/** Typing indicator pulse */
export const typingIndicatorVariants = {
  animate: {
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
} as const;
