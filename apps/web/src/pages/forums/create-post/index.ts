/**
 * Create Post Module
 *
 * Forum post creation page with support for multiple post types
 * (text, image, link, video, poll), attachment uploads, and markdown editing.
 *
 */

// Main component
export { default } from './create-post';

// Sub-components
export { default as PostTypeTabs } from './post-type-tabs';

// Hooks
export { useCreatePost } from './hooks';

// Types
export type { PostType } from './types';
