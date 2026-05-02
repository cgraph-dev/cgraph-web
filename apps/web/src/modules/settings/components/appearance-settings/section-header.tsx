/**
 * Section Header Component
 *
 * Header with icon, title, and optional description.
 */

import type { SectionHeaderProps } from './types';

// COMPONENT

export function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="bg-primary-500/10 rounded-lg p-2 text-primary-400">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-[var(--token-text-primary)]">{title}</h3>
        {description && <p className="text-sm text-[var(--token-text-secondary)]">{description}</p>}
      </div>
    </div>
  );
}

export default SectionHeader;
