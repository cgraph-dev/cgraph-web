/**
 * Animation Engine - Barrel Export
 *
 * Re-exports all animation engine submodules and types.
 *
 */

// Re-export types and presets from the types module
export type {
  AnimationConfig,
  SpringConfig,
  GestureConfig,
  SequenceStep,
} from '../animation-engine.types';
export { ANIMATION_PRESETS } from '../animation-engine.types';

// Re-export submodules
export { SpringPhysics } from './spring-physics';
export { HapticFeedback } from './haptic-feedback';
export { AnimationEngine } from './animation-engine-core';
export { GestureHandler } from './gesture-handler';

// Default export
export { AnimationEngine as default } from './animation-engine-core';
