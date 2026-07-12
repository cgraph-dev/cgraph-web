/**
 * Customization Store - Selectors
 *
 * All selector hooks extracted from customizationStore.ts.
 * IMPORTANT: Always use individual primitive selectors to avoid infinite render loops.
 * Object-returning selectors create new references on every render, breaking React.
 * Pattern: useCustomizationStore(s => s.fieldName)
 *
 */

import { useCustomizationStore } from './customizationStore';

// INDIVIDUAL SELECTORS

// Theme selectors
export const useThemePreset = () => useCustomizationStore((s) => s.themePreset);
export const useEffectPreset = () => useCustomizationStore((s) => s.effectPreset);
export const useAnimationSpeed = () => useCustomizationStore((s) => s.animationSpeed);
export const useParticlesEnabled = () => useCustomizationStore((s) => s.particlesEnabled);
export const useGlowEnabled = () => useCustomizationStore((s) => s.glowEnabled);
export const useBlurEnabled = () => useCustomizationStore((s) => s.blurEnabled);
export const useAnimatedBackground = () => useCustomizationStore((s) => s.animatedBackground);

// Avatar selectors
export const useAvatarBorderType = () => useCustomizationStore((s) => s.avatarBorderType);
export const useAvatarBorderColor = () => useCustomizationStore((s) => s.avatarBorderColor);
export const useAvatarSize = () => useCustomizationStore((s) => s.avatarSize);

// Avatar selectors (Chat selectors archived)

// Profile selectors
export const useProfileColor = () => useCustomizationStore((s) => s.profileColor);
export const useProfileCardStyle = () => useCustomizationStore((s) => s.profileCardStyle);
export const useShowBadges = () => useCustomizationStore((s) => s.showBadges);
export const useShowBio = () => useCustomizationStore((s) => s.showBio);
export const useShowStatus = () => useCustomizationStore((s) => s.showStatus);
export const useEquippedTitle = () => useCustomizationStore((s) => s.equippedTitle);
export const useEquippedBadges = () => useCustomizationStore((s) => s.equippedBadges);

// Sync state selectors
export const useIsLoading = () => useCustomizationStore((s) => s.isLoading);
export const useIsSaving = () => useCustomizationStore((s) => s.isSaving);
export const useIsDirty = () => useCustomizationStore((s) => s.isDirty);
export const useSyncError = () => useCustomizationStore((s) => s.error);
