/**
 * Social Hub - Utility Functions
 */

// SEARCH HELPERS

/**
 * Retrieves search result icon.
 *
 * @param type - The type.
 * @returns The search result icon.
 */
export function getSearchResultIcon(type: string): string {
  switch (type) {
    case 'user':
      return '👤';
    case 'forum':
      return '📰';
    case 'group':
      return '👥';
    default:
      return '🔍';
  }
}

// TIME FORMATTING

/**
 * Formats time ago.
 *
 * @param date - The date.
 * @returns The processed result.
 */
export function formatTimeAgo(date: Date): string {
  if (!date || isNaN(date.getTime())) return 'Recently';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
