/**
 * Shared chat UI preference contract.
 *
 * This lives with the chat rendering components so routed pages, Vault, and
 * future desktop/mobile adapters consume the same bubble/media defaults.
 */

export interface UIPreferences {
  glassEffect: 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic' | 'aurora';
  animationIntensity: 'low' | 'medium' | 'high';
  showParticles: boolean;
  enableGlow: boolean;
  enable3D: boolean;
  enableHaptic: boolean;
  voiceVisualizerTheme: 'matrix-green' | 'cyber-blue' | 'neon-pink' | 'sunset-orange';
  messageEntranceAnimation: 'slide' | 'fade' | 'scale' | 'bounce';
}

export const DEFAULT_UI_PREFERENCES: UIPreferences = {
  glassEffect: 'holographic',
  animationIntensity: 'high',
  showParticles: false,
  enableGlow: true,
  enable3D: true,
  enableHaptic: true,
  voiceVisualizerTheme: 'matrix-green',
  messageEntranceAnimation: 'slide',
};
