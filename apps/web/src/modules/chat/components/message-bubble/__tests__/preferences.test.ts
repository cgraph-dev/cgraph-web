import { describe, expect, it } from 'vitest';
import { DEFAULT_CHAT_UI_PREFERENCES } from '@cgraph-dev/shared-types';
import {
  DEFAULT_UI_PREFERENCES,
  getMessageBubbleClass,
  getMessageEffectClass,
} from '../preferences';
import { DEFAULT_UI_PREFERENCES as ROUTE_DEFAULT_UI_PREFERENCES } from '@/pages/messages/conversation/types';

describe('chat UI preferences contract', () => {
  it('owns the default preferences in the shared chat module', () => {
    expect(ROUTE_DEFAULT_UI_PREFERENCES).toBe(DEFAULT_UI_PREFERENCES);
    expect(DEFAULT_UI_PREFERENCES).toBe(DEFAULT_CHAT_UI_PREFERENCES);
  });

  it('keeps decorative particle overlays disabled by default', () => {
    expect(DEFAULT_UI_PREFERENCES.showParticles).toBe(false);
  });
});

describe('message bubble CSS adapter', () => {
  it('maps shared bubble preset IDs to web CSS classes', () => {
    expect(getMessageBubbleClass('default')).toBe('bubble-default');
    expect(getMessageBubbleClass('rounded')).toBe('bubble-rounded');
    expect(getMessageBubbleClass('glass')).toBe('bubble-glass');
    expect(getMessageBubbleClass('neon')).toBe('bubble-neon');
    expect(getMessageBubbleClass('3d')).toBe('bubble-3d');
  });

  it('normalizes unknown bubble styles to the default web CSS class', () => {
    expect(getMessageBubbleClass('unknown')).toBe('bubble-default');
    expect(getMessageBubbleClass('')).toBe('bubble-default');
  });

  it('maps supported message effects to web CSS classes', () => {
    expect(getMessageEffectClass('slide')).toBe('message-effect-slide');
    expect(getMessageEffectClass('fade')).toBe('message-effect-fade');
    expect(getMessageEffectClass('bounce')).toBe('message-effect-bounce');
    expect(getMessageEffectClass('glitch')).toBe('message-effect-glitch');
    expect(getMessageEffectClass('confetti')).toBe('message-effect-confetti');
  });

  it('ignores absent, disabled, and unknown message effects', () => {
    expect(getMessageEffectClass('none')).toBe('');
    expect(getMessageEffectClass('')).toBe('');
    expect(getMessageEffectClass('unknown')).toBe('');
  });
});
