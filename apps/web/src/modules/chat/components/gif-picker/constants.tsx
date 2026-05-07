import {
  FireIcon,
  HeartIcon,
  SparklesIcon,
  FaceSmileIcon,
  HandThumbUpIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';
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
export const FAVORITES_KEY = STORAGE_KEYS.gifFavorites;
export const RECENT_KEY = STORAGE_KEYS.gifRecent;

/**
 * Limits
 */
export const MAX_RECENT = 20;
export const MAX_FAVORITES = 50;
