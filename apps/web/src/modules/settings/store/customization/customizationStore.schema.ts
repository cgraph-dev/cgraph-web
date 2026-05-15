/**
 * Customization Store - API Schema Mapping & Persistence
 *
 * Contains the API schema mapper (camelCase <-> snake_case),
 * debounced save logic, and persistence configuration.
 *
 */

import { http } from '@/lib/api-client';
import { notifyCustomizationChanged } from '@/lib/socket/customization-events';
import { createSchemaMapper, createDebouncedSave } from '@/lib/store-helpers';

import type { CustomizationState, CustomizationStore } from './customizationStore.types';

// Re-export CustomizationState for use by the schema mapper
export type { CustomizationState };

// API SCHEMA MAPPING

export const apiSchemaMapper = createSchemaMapper<CustomizationState>({
  // Theme
  themePreset: 'app_theme',
  effectPreset: 'background_effect',
  animationSpeed: 'animation_speed',
  particlesEnabled: 'particles_enabled',
  glowEnabled: 'glow_enabled',
  blurEnabled: 'blur_enabled',
  animatedBackground: 'animated_background',

  // Avatar
  avatarBorderType: 'border_style',
  avatarBorderColor: 'avatar_border_color',
  avatarSize: 'avatar_size',
  selectedBorderTheme: 'selected_border_theme',
  selectedBorderId: 'avatar_border_id',

  // Chat
  chatBubbleStyle: 'bubble_style',
  chatBubbleColor: 'bubble_color',
  bubbleBorderRadius: 'bubble_radius',
  bubbleShadowIntensity: 'bubble_shadow_intensity',
  bubbleEntranceAnimation: 'message_effect',
  bubbleGlassEffect: 'bubble_glass_effect',
  bubbleShowTail: 'bubble_show_tail',
  bubbleHoverEffect: 'bubble_hover_effect',
  groupMessages: 'group_messages',
  showTimestamps: 'show_timestamps',
  compactMode: 'compact_mode',

  // Profile
  profileCardStyle: 'profile_layout',
  selectedProfileThemeId: 'profile_theme',
  showBadges: 'show_badges',
  showBio: 'show_bio',
  showStatus: 'show_status',
  glowEffects: 'glow_effects',
  particleEffects: 'particle_effects',

  // Identity
  equippedTitle: 'title_id',
  equippedBadges: 'equipped_badges',

  // Display Name Style
  displayNameFont: 'display_name_font',
  displayNameEffect: 'display_name_effect',
  displayNameColor: 'display_name_color',
  displayNameSecondaryColor: 'display_name_secondary_color',

  // Nameplate
  equippedNameplate: 'equipped_nameplate',

  // Profile Theme Preset
  profileThemePresetId: 'profile_theme_preset_id',
  profileThemePrimary: 'profile_theme_primary',
  profileThemeAccent: 'profile_theme_accent',
});

// DEBOUNCED SAVE

export const debouncedSave = createDebouncedSave<CustomizationStore>(
  async (state, _set) => {
    const payload = apiSchemaMapper.toApi(state);
    await http.patch('/api/v1/me/customizations', {
      ...payload,
      custom_config: payload,
    });
    // Notify friends via WebSocket that customizations have changed
    notifyCustomizationChanged();
  },
  { delay: 1000 }
);

// PERSISTENCE CONFIG

export const PERSIST_PARTIALIZE = (state: CustomizationStore) => ({
  themePreset: state.themePreset,
  effectPreset: state.effectPreset,
  animationSpeed: state.animationSpeed,
  particlesEnabled: state.particlesEnabled,
  glowEnabled: state.glowEnabled,
  blurEnabled: state.blurEnabled,
  animatedBackground: state.animatedBackground,
  avatarBorderColor: state.avatarBorderColor,
  avatarSize: state.avatarSize,
  selectedBorderTheme: state.selectedBorderTheme,
  chatBubbleStyle: state.chatBubbleStyle,
  chatBubbleColor: state.chatBubbleColor,
  bubbleBorderRadius: state.bubbleBorderRadius,
  bubbleShadowIntensity: state.bubbleShadowIntensity,
  bubbleEntranceAnimation: state.bubbleEntranceAnimation,
  bubbleGlassEffect: state.bubbleGlassEffect,
  bubbleShowTail: state.bubbleShowTail,
  bubbleHoverEffect: state.bubbleHoverEffect,
  groupMessages: state.groupMessages,
  showTimestamps: state.showTimestamps,
  compactMode: state.compactMode,
  profileCardStyle: state.profileCardStyle,
  selectedProfileThemeId: state.selectedProfileThemeId,
  showBadges: state.showBadges,
  showBio: state.showBio,
  showStatus: state.showStatus,
  glowEffects: state.glowEffects,
  particleEffects: state.particleEffects,
  displayNameFont: state.displayNameFont,
  displayNameEffect: state.displayNameEffect,
  displayNameColor: state.displayNameColor,
  displayNameSecondaryColor: state.displayNameSecondaryColor,
  profileThemePresetId: state.profileThemePresetId,
  profileThemePrimary: state.profileThemePrimary,
  profileThemeAccent: state.profileThemeAccent,
});
