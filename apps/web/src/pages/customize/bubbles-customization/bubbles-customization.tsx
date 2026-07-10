/**
 * Chat-bubble customization page.
 *
 * Wires the existing `BubblesTab` sub-component from the Theme Customizer
 * into the /me/appearance/:category surface. Writes go to BOTH the
 * theme Zustand store (used by the appearance pages) AND the
 * customization Zustand store (used by message-bubble.tsx and the rest
 * of the chat surfaces). Without the second write, bubble style /
 * radius / colour selections never reached the actual chat UI.
 */
import { normalizeChatBubbleStyleId } from '@cgraph-dev/design-tokens';
import { isChatUiMessageEntranceAnimation } from '@cgraph-dev/shared-types';
import { useThemeStore } from '@/stores/theme';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { BubblesTab } from '@/components/theme/theme-customizer/bubbles-tab';
import { ChatColorPicker } from '@/modules/settings/components/customize/panels/chat-color-picker';
import type { ChatBubbleStylePreset, ThemeColorPreset } from '@/stores';
import type { ThemePreset } from '@/modules/settings/store/customization/customizationStore.types';

const COLOR_MAP: Readonly<Record<ThemeColorPreset, ThemePreset>> = {
  emerald: 'emerald',
  purple: 'purple',
  cyan: 'cyan',
  orange: 'orange',
  pink: 'pink',
  gold: 'gold',
  crimson: 'crimson',
  arctic: 'arctic',
  sunset: 'orange',
  midnight: 'purple',
  forest: 'emerald',
  ocean: 'cyan',
};

/** Bubbles category — renders BubblesTab bound to both stores. */
export default function BubblesCustomization() {
  const { theme, setChatBubbleStyle, updateTheme } = useThemeStore();
  const customizationSetStyle = useCustomizationStore((s) => s.setChatBubbleStyle);
  const customizationSetColor = useCustomizationStore((s) => s.setChatBubbleColor);
  const customizationSetRadius = useCustomizationStore((s) => s.setBubbleBorderRadius);
  const customizationSetShadow = useCustomizationStore((s) => s.setBubbleShadowIntensity);
  const customizationSetAnimation = useCustomizationStore((s) => s.setBubbleAnimation);

  function handleSelectStyle(style: ChatBubbleStylePreset): void {
    setChatBubbleStyle(style);
    customizationSetStyle(normalizeChatBubbleStyleId(style));
    HapticFeedback.light();
  }

  function handleSelectColor(color: ThemeColorPreset): void {
    updateTheme({ chatBubbleColor: color });
    customizationSetColor(COLOR_MAP[color]);
  }

  function handleUpdateSettings(settings: Record<string, unknown>): void {
    updateTheme(settings);
    // BubblesTab dispatches snake-case bubbleBorderRadius /
    // bubbleShadowIntensity / bubbleEntranceAnimation keys; mirror them
    // into the customization store so the chat surfaces re-render.
    const radius = settings.bubbleBorderRadius;
    const shadow = settings.bubbleShadowIntensity;
    const entrance = settings.bubbleEntranceAnimation;
    if (typeof radius === 'number') customizationSetRadius(radius);
    if (typeof shadow === 'number') customizationSetShadow(shadow);
    if (isChatUiMessageEntranceAnimation(entrance)) customizationSetAnimation(entrance);
  }

  return (
    <div className="space-y-8">
      <ChatColorPicker />
      <BubblesTab
        selectedStyle={theme.chatBubbleStyle}
        selectedColor={theme.chatBubbleColor}
        bubbleSettings={{
          radius: theme.bubbleBorderRadius,
          shadow: theme.bubbleShadowIntensity,
          glass: theme.bubbleGlassEffect,
          tail: theme.bubbleShowTail ?? true,
          hover: theme.bubbleHoverEffect ?? true,
          entrance: theme.bubbleEntranceAnimation ?? 'slide',
        }}
        onSelectStyle={handleSelectStyle}
        onSelectColor={handleSelectColor}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
