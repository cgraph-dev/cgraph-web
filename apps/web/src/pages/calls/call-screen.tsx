/**
 * Call Screen - Voice and Video Calls
 *
 * Full-featured WebRTC call interface with:
 * - Video grid layout with PiP mode
 * - Audio-only mode with avatars
 * - Screen sharing
 * - Call controls (mute, camera, end)
 * - Connection status indicators
 *
 *
 * This file re-exports from the modular call-screen/ directory.
 * See call-screen/index.ts for the full module structure.
 */

export { CallScreen as default } from './call-screen/index';
export * from './call-screen/index';
