/**
 * Admin empty state placeholder.
 */
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Empty State — fallback UI for empty data states.
 */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
      <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
      <p>{message}</p>
    </div>
  );
}
