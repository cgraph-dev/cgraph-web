/**
 * Effects customization page.
 *
 * Wires the existing `EffectsTab` sub-component from the Theme Customizer
 * into the `/me/appearance/:category` surface so users can pick visual
 * effect preset / animation speed / particle toggle directly without
 * opening the standalone customizer modal. State flows through the
 * theme Zustand store the same way the full customizer does.
 */
import { useThemeStore } from '@/stores/theme';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { EffectsTab } from '@/components/theme/theme-customizer/effects-tab';
import type { EffectPreset } from '@/stores/theme';

/** Effects category — renders EffectsTab bound to the theme store. */
export default function EffectsCustomization() {
  const effectPreset = useThemeStore((state) => state.effectPreset);
  const animationSpeed = useThemeStore((state) => state.animationSpeed);
  const particlesEnabled = useThemeStore((state) => state.particlesEnabled);
  const setEffectPreset = useThemeStore((state) => state.setEffectPreset);
  const setAnimationSpeed = useThemeStore((state) => state.setAnimationSpeed);
  const toggleParticles = useThemeStore((state) => state.toggleParticles);

  function handleSelectEffect(effect: EffectPreset): void {
    setEffectPreset(effect);
    HapticFeedback.light();
  }

  function handleSetSpeed(speed: 'slow' | 'normal' | 'fast'): void {
    setAnimationSpeed(speed);
    HapticFeedback.light();
  }

  function handleToggleParticles(): void {
    toggleParticles();
    HapticFeedback.light();
  }

  return (
    <EffectsTab
      selectedEffect={effectPreset}
      animationSpeed={animationSpeed}
      particlesEnabled={particlesEnabled}
      onSelectEffect={handleSelectEffect}
      onSetSpeed={handleSetSpeed}
      onToggleParticles={handleToggleParticles}
    />
  );
}
