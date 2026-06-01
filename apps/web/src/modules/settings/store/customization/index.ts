/**
 * Customization Store - Single Export Point
 *
 * Re-exports all customization-related functionality from customizationStore.ts
 */

// Main store — import directly to avoid barrel cycle with customizationStore.ts
export { useCustomizationStore } from './customizationStore';

// Types — import from types file directly to break re-export cycle
export type {
  ThemePreset,
  EffectPreset,
  AnimationSpeed,
  AvatarBorderType,
  ChatBubbleStyle,
  ProfileCardStyle,
  BubbleAnimation,
  ThemeColors,
  CustomizationState,
  CustomizationStore,
} from './customizationStore.types';

// Constants — import from types file directly
export { THEME_COLORS, AVATAR_BORDERS, RARITY_COLORS } from './customizationStore.types';

// Theme selectors — imported directly from selectors to avoid circular dep
export {
  useThemePreset,
  useEffectPreset,
  useAnimationSpeed,
  useParticlesEnabled,
  useGlowEnabled,
  useBlurEnabled,
  useAnimatedBackground,
} from './customizationStore.selectors';

// Avatar selectors
export {
  useAvatarBorderType,
  useAvatarBorderColor,
  useAvatarSize,
} from './customizationStore.selectors';

// Profile selectors
export {
  useProfileCardStyle,
  useShowBadges,
  useShowBio,
  useShowStatus,
  useEquippedTitle,
  useEquippedBadges,
} from './customizationStore.selectors';

// Loading state selectors
export {
  useIsLoading,
  useIsSaving,
  useIsDirty,
  useSyncError,
} from './customizationStore.selectors';

// Mappings
export * from './mappings';
