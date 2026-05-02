/**
 * PostTypeTabs Component - Post type selector tabs
 */
import { PhotoIcon, LinkIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import type { PostType } from './types';

interface PostTypeTabsProps {
  postType: PostType;
  setPostType: (type: PostType) => void;
}

export default function PostTypeTabs({ postType, setPostType }: PostTypeTabsProps) {
  return (
    <div className="mb-6 flex gap-2 border-b border-[var(--token-card-border)] pb-4">
      <button
        onClick={() => setPostType('text')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          postType === 'text'
            ? 'bg-primary-600 text-white'
            : 'bg-[var(--token-card-bg)] text-gray-400 hover:bg-[var(--token-card-bg)]'
        }`}
      >
        Text
      </button>
      <button
        onClick={() => setPostType('image')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          postType === 'image'
            ? 'bg-primary-600 text-white'
            : 'bg-[var(--token-card-bg)] text-gray-400 hover:bg-[var(--token-card-bg)]'
        }`}
      >
        <PhotoIcon className="h-5 w-5" />
        Image
      </button>
      <button
        onClick={() => setPostType('link')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          postType === 'link'
            ? 'bg-primary-600 text-white'
            : 'bg-[var(--token-card-bg)] text-gray-400 hover:bg-[var(--token-card-bg)]'
        }`}
      >
        <LinkIcon className="h-5 w-5" />
        Link
      </button>
      <button
        onClick={() => setPostType('poll')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          postType === 'poll'
            ? 'bg-primary-600 text-white'
            : 'bg-[var(--token-card-bg)] text-gray-400 hover:bg-[var(--token-card-bg)]'
        }`}
      >
        <ChartBarIcon className="h-5 w-5" />
        Poll
      </button>
    </div>
  );
}
