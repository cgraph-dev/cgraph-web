/**
 * Chat customization panel constants.
 */
import { chatBubblePresets, type ChatBubblePresetId } from '@cgraph-dev/design-tokens';
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

export const bubbleAnimations: { id: BubbleAnimation; name: string; icon: string }[] = [
  { id: 'none', name: 'None', icon: '⏹️' },
  { id: 'slide', name: 'Slide', icon: '➡️' },
  { id: 'fade', name: 'Fade', icon: '🌫️' },
  { id: 'scale', name: 'Scale', icon: '🔍' },
  { id: 'bounce', name: 'Bounce', icon: '🏀' },
  { id: 'flip', name: 'Flip', icon: '🔄' },
];
