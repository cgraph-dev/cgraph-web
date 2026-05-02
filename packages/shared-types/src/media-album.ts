/**
 * Media album types for grouping photos/videos into a single visual unit.
 * Mirrors Telegram's grouped_id on messages — up to 10 items share
 * the same album_id and render as one adaptive grid.
 */

/** A single item within a media album. */
export interface MediaAlbumItem {
  readonly id: string;
  readonly albumId: string;
  readonly fileUrl: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly fileMimeType: string;
  readonly thumbnailUrl?: string;
  readonly contentType: 'image' | 'video';
}

/** Discriminated union of album layout variants based on item count. */
export type AlbumLayout =
  | { type: 'pair'; items: [MediaAlbumItem, MediaAlbumItem] }
  | { type: 'triple'; large: MediaAlbumItem; small: [MediaAlbumItem, MediaAlbumItem] }
  | { type: 'grid'; items: ReadonlyArray<MediaAlbumItem>; columns: 2 };

/**
 * Compute the visual layout for a set of album items.
 * - 2 items: side-by-side pair
 * - 3 items: 1 large left + 2 small right (Telegram pattern)
 * - 4+ items: 2-column grid
 */
export function computeAlbumLayout(items: ReadonlyArray<MediaAlbumItem>): AlbumLayout {
  const first = items[0];
  const second = items[1];
  const third = items[2];

  if (items.length === 2 && first !== undefined && second !== undefined) {
    return { type: 'pair', items: [first, second] };
  }
  if (items.length === 3 && first !== undefined && second !== undefined && third !== undefined) {
    return { type: 'triple', large: first, small: [second, third] };
  }
  return { type: 'grid', items, columns: 2 };
}
