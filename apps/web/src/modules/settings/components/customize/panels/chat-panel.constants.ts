/**
 * Chat customization panel constants.
 */
import {
  chatBubblePresets,
  type ChatBubblePresetId,
} from "@cgraph-dev/design-tokens";
import { CHAT_UI_MESSAGE_ENTRANCE_ANIMATIONS } from "@cgraph-dev/shared-types";
import type {
  ChatBubbleStyle,
  BubbleAnimation,
} from "@/modules/settings/store/customization";
import {
  CHAT_THEME_BASES,
  chatThemePresetId,
  deriveDarkChatThemeMessageColors,
  getChatThemeAccentPresetsForBase,
  type ChatThemeAccentPreset,
  type ChatThemeBase,
} from "@cgraph-dev/shared-types/chat-theme";
import {
  chatThemeSettingsToPreviewStyle,
  chatThemePresetToPreviewStyle,
  getChatThemePresetSwatch,
  type ChatThemePreviewStyle,
} from "./chat-theme-preview";

export type {
  ChatThemeAccentPreset,
  ChatThemeBase,
} from "@cgraph-dev/shared-types/chat-theme";
export type { ChatThemePreviewStyle } from "./chat-theme-preview";

export {
  CHAT_THEME_BASES,
  chatThemePresetId,
  chatThemeSettingsToPreviewStyle,
  chatThemePresetToPreviewStyle,
  deriveDarkChatThemeMessageColors,
  getChatThemeAccentPresetsForBase,
  getChatThemePresetSwatch,
};

const bubbleIcons = {
  default: "*",
  rounded: "()",
  sharp: "[]",
  cloud: "~",
  minimal: "-",
  modern: "/",
  retro: "#",
  glass: "+",
  neon: "!",
  outline: "<>",
  "three-d": "3D",
} as const satisfies Record<ChatBubblePresetId, string>;

export const bubbleStyles: {
  id: ChatBubbleStyle;
  name: string;
  icon: string;
}[] = chatBubblePresets.map((preset) => ({
  id: preset.id,
  name: preset.name,
  icon: bubbleIcons[preset.id],
}));

const bubbleAnimationMetadata = {
  none: { name: "None", icon: "⏹️" },
  slide: { name: "Slide", icon: "➡️" },
  fade: { name: "Fade", icon: "🌫️" },
  scale: { name: "Scale", icon: "🔍" },
  bounce: { name: "Bounce", icon: "🏀" },
  flip: { name: "Flip", icon: "🔄" },
} as const satisfies Record<BubbleAnimation, { name: string; icon: string }>;

export const bubbleAnimations: {
  id: BubbleAnimation;
  name: string;
  icon: string;
}[] = CHAT_UI_MESSAGE_ENTRANCE_ANIMATIONS.map((id) => ({
  id,
  ...bubbleAnimationMetadata[id],
}));

export const DEFAULT_CHAT_THEME_BASE: ChatThemeBase = "classic";

const chatThemeBaseLabels = {
  classic: "Classic",
  day: "Day",
  night: "Night",
  tinted: "Tinted",
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
