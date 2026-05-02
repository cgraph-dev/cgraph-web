/**
 * Media Album — adaptive grid layout for grouped photos/videos.
 * Mirrors Telegram's ChatMessageCell grouped media layout:
 * - 2 items: side by side
 * - 3 items: 1 large left + 2 small right
 * - 4+ items: 2-column grid
 */
import type { ReactNode } from 'react';
import type { MediaAlbumItem } from '@cgraph/shared-types';
import { computeAlbumLayout } from '@cgraph/shared-types';

interface MediaAlbumProps {
  readonly items: ReadonlyArray<MediaAlbumItem>;
  readonly onItemClick?: (item: MediaAlbumItem) => void;
}

/** Render a single media item (image or video with play overlay). */
function renderItem(
  item: MediaAlbumItem,
  className: string,
  onItemClick?: (item: MediaAlbumItem) => void
): ReactNode {
  const isVideo = item.contentType === 'video';
  return (
    <button
      key={item.id}
      type="button"
      onClick={() => onItemClick?.(item)}
      className={`relative overflow-hidden rounded-sm ${className}`}
    >
      <img
        src={item.thumbnailUrl ?? item.fileUrl}
        alt={item.fileName}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50">
            <span className="ml-0.5 text-sm text-white">{'\u25b6'}</span>
          </div>
        </div>
      )}
    </button>
  );
}

/**
 * Renders a group of media items in an adaptive grid layout
 * based on the number of items (Telegram-style grouping).
 */
function MediaAlbum(props: MediaAlbumProps): ReactNode {
  const { items, onItemClick } = props;

  if (items.length === 0) {
    return null;
  }

  const layout = computeAlbumLayout(items);

  if (layout.type === 'pair') {
    return (
      <div className="grid max-w-[400px] grid-cols-2 gap-0.5 overflow-hidden rounded-lg">
        {renderItem(layout.items[0], 'aspect-square', onItemClick)}
        {renderItem(layout.items[1], 'aspect-square', onItemClick)}
      </div>
    );
  }

  if (layout.type === 'triple') {
    return (
      <div className="grid max-w-[400px] grid-cols-2 gap-0.5 overflow-hidden rounded-lg">
        <div className="row-span-2">
          {renderItem(layout.large, 'aspect-[2/3] h-full', onItemClick)}
        </div>
        {renderItem(layout.small[0], 'aspect-square', onItemClick)}
        {renderItem(layout.small[1], 'aspect-square', onItemClick)}
      </div>
    );
  }

  // Grid layout for 4+ items
  return (
    <div className="grid max-w-[400px] grid-cols-2 gap-0.5 overflow-hidden rounded-lg">
      {layout.items.map((item) => renderItem(item, 'aspect-square', onItemClick))}
    </div>
  );
}

export { MediaAlbum };
