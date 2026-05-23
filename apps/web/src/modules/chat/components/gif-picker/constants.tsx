import {
  FireIcon,
  HeartIcon,
  SparklesIcon,
  FaceSmileIcon,
  HandThumbUpIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import type { GifCategory } from './types';

/**
 * Available GIF categories
 */
export const GIF_CATEGORIES: GifCategory[] = [
  { id: 'trending', name: 'Trending', icon: <FireIcon className="h-4 w-4" />, searchTerm: '' },
  {
    id: 'reactions',
    name: 'Reactions',
    icon: <FaceSmileIcon className="h-4 w-4" />,
    searchTerm: 'reaction',
  },
  {
    id: 'emotions',
    name: 'Emotions',
    icon: <SparklesIcon className="h-4 w-4" />,
    searchTerm: 'emotion mood',
  },
  {
    id: 'agree',
    name: 'Agree',
    icon: <HandThumbUpIcon className="h-4 w-4" />,
    searchTerm: 'agree yes thumbs up',
  },
  { id: 'love', name: 'Love', icon: <HeartIcon className="h-4 w-4" />, searchTerm: 'love heart' },
  {
    id: 'memes',
    name: 'Memes',
    icon: <GlobeAltIcon className="h-4 w-4" />,
    searchTerm: 'meme funny',
  },
];

/**
 * Local storage keys
 */
export const GIF_STORAGE_SCHEMA_VERSION = 1;
export const GIF_STORAGE_PREFIX = `cgraph:gif-picker:v${GIF_STORAGE_SCHEMA_VERSION}`;
export const FAVORITES_KEY = `${GIF_STORAGE_PREFIX}:favorites`;
export const RECENT_KEY = `${GIF_STORAGE_PREFIX}:recent`;
export const LEGACY_GIF_STORAGE_PREFIX = ['cgraph', 'gif'].join('-');
export const LEGACY_FAVORITES_KEY = `${LEGACY_GIF_STORAGE_PREFIX}-favorites`;
export const LEGACY_RECENT_KEY = `${LEGACY_GIF_STORAGE_PREFIX}-recent`;

/**
 * Limits
 */
export const MAX_RECENT = 20;
export const MAX_FAVORITES = 50;
