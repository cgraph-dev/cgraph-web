/**
 * PostIconDisplay - display a single post icon
 */

import { memo, useState } from 'react';
import { FaceSmileIcon } from '@heroicons/react/24/outline';

import { SIZE_CLASSES } from './constants';
import type { PostIconDisplayProps } from './types';

export const PostIconDisplay = memo(function PostIconDisplay({
  icon,
  size = 'md',
  showName = false,
  className = '',
}: PostIconDisplayProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title={icon.name}>
      {!imageError && icon.icon_url ? (
        <img
          src={icon.icon_url}
          alt={icon.name}
          className={`${SIZE_CLASSES[size]} object-contain`}
          onError={handleImageError}
        />
      ) : icon.emoji ? (
        <span className={`${SIZE_CLASSES[size]} flex items-center justify-center text-base`}>
          {icon.emoji}
        </span>
      ) : (
        <FaceSmileIcon className={`${SIZE_CLASSES[size]} text-gray-400`} />
      )}
      {showName && <span className="text-sm text-gray-600 dark:text-gray-400">{icon.name}</span>}
    </span>
  );
});
