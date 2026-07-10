import {
  CHAT_THEME_BASES,
  chatThemePresetId,
  deriveDarkChatThemeMessageColors,
  getChatThemeAccentPresetsForBase,
  type ChatThemeAccentPreset,
  type ChatThemeBase,
} from '@cgraph-dev/shared-types/chat-theme';
import {
  chatThemeSettingsToPreviewStyle,
  chatThemePresetToPreviewStyle,
  getChatThemePresetSwatch,
  type ChatThemePreviewStyle,
} from './chat-theme-preview';

export type {
  ChatThemeAccentPreset,
  ChatThemeBase,
} from '@cgraph-dev/shared-types/chat-theme';
export type { ChatThemePreviewStyle } from './chat-theme-preview';

export {
  CHAT_THEME_BASES,
  chatThemePresetId,
  chatThemeSettingsToPreviewStyle,
  chatThemePresetToPreviewStyle,
  deriveDarkChatThemeMessageColors,
  getChatThemeAccentPresetsForBase,
  getChatThemePresetSwatch,
};

const chatThemeBaseLabels = {
  classic: 'Classic',
  day: 'Day',
  night: 'Night',
  tinted: 'Tinted',
} as const satisfies Record<ChatThemeBase, string>;

export const chatThemeBaseTabs: { id: ChatThemeBase; label: string }[] =
  CHAT_THEME_BASES.map((id) => ({
    id,
    label: chatThemeBaseLabels[id],
  }));

export function getDefaultChatThemePresetId(base: ChatThemeBase): string {
  const firstPreset = getChatThemeAccentPresetsForBase(base)[0];
  if (!firstPreset) {
    throw new Error(`No chat theme presets registered for ${base}`);
  }
  return chatThemePresetId(firstPreset);
}

export function getChatThemePresetById(
  base: ChatThemeBase,
  presetId: string,
): ChatThemeAccentPreset {
  const presets = getChatThemeAccentPresetsForBase(base);
  const preset =
    presets.find((item) => chatThemePresetId(item) === presetId) ?? presets[0];
  if (!preset) {
    throw new Error(`No chat theme presets registered for ${base}`);
  }
  return preset;
}

export function getChatThemePreviewStyle(
  base: ChatThemeBase,
  presetId: string,
): ChatThemePreviewStyle {
  return chatThemePresetToPreviewStyle(
    getChatThemePresetById(base, presetId),
    base,
  );
}
