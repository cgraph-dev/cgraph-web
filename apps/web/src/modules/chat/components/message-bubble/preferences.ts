/**
 * Chat UI preference adapter.
 *
 * Runtime-neutral values and defaults live in @cgraph-dev/shared-types. Web
 * keeps this compatibility export for routed chat components.
 */

import { DEFAULT_CHAT_UI_PREFERENCES } from '@cgraph-dev/shared-types';
import type { ChatUiPreferences } from '@cgraph-dev/shared-types';
import {
  normalizeChatBubbleStyleId,
  type ChatBubblePresetId,
} from '@cgraph-dev/design-tokens';

export type UIPreferences = ChatUiPreferences;

export const DEFAULT_UI_PREFERENCES: UIPreferences = DEFAULT_CHAT_UI_PREFERENCES;

export function getMessageBubbleClass(bubbleStyle: string): string {
  const bubbleClassMap: Record<ChatBubblePresetId, string> = {
    default: 'bubble-default',
    rounded: 'bubble-rounded',
    sharp: 'bubble-sharp',
    cloud: 'bubble-cloud',
    modern: 'bubble-modern',
    minimal: 'bubble-minimal',
    glass: 'bubble-glass',
    neon: 'bubble-neon',
    retro: 'bubble-retro',
    'three-d': 'bubble-3d',
    outline: 'bubble-outline',
  };

  return bubbleClassMap[normalizeChatBubbleStyleId(bubbleStyle)];
}

export function getMessageEffectClass(messageEffect: string): string {
  if (!messageEffect || messageEffect === 'none') return '';

  const effectClassMap: Record<string, string> = {
    slide: 'message-effect-slide',
    fade: 'message-effect-fade',
    bounce: 'message-effect-bounce',
    typewriter: 'message-effect-typewriter',
    glitch: 'message-effect-glitch',
    sparkle: 'message-effect-sparkle',
    confetti: 'message-effect-confetti',
    ripple: 'message-effect-ripple',
  };

  return effectClassMap[messageEffect] || '';
}
