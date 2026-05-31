/**
 * Chat customization panel constants.
 */
import { chatBubblePresets, type ChatBubblePresetId } from '@cgraph-dev/design-tokens';
import { CHAT_UI_MESSAGE_ENTRANCE_ANIMATIONS } from '@cgraph-dev/shared-types';
import type { ChatBubbleStyle, BubbleAnimation } from '@/modules/settings/store/customization';

const bubbleIcons = {
  default: '*',
  rounded: '()',
  sharp: '[]',
  cloud: '~',
  minimal: '-',
  modern: '/',
  retro: '#',
  glass: '+',
  neon: '!',
  outline: '<>',
  'three-d': '3D',
} as const satisfies Record<ChatBubblePresetId, string>;

export const bubbleStyles: { id: ChatBubbleStyle; name: string; icon: string }[] =
  chatBubblePresets.map((preset) => ({
    id: preset.id,
    name: preset.name,
    icon: bubbleIcons[preset.id],
  }));

const bubbleAnimationMetadata = {
  none: { name: 'None', icon: '⏹️' },
  slide: { name: 'Slide', icon: '➡️' },
  fade: { name: 'Fade', icon: '🌫️' },
  scale: { name: 'Scale', icon: '🔍' },
  bounce: { name: 'Bounce', icon: '🏀' },
  flip: { name: 'Flip', icon: '🔄' },
} as const satisfies Record<BubbleAnimation, { name: string; icon: string }>;

export const bubbleAnimations: { id: BubbleAnimation; name: string; icon: string }[] =
  CHAT_UI_MESSAGE_ENTRANCE_ANIMATIONS.map((id) => ({
    id,
    ...bubbleAnimationMetadata[id],
  }));
