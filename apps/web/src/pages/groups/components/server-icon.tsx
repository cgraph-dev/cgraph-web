import { NavLink } from 'react-router-dom';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { ServerIconProps } from './types';
import { getGroupRoute } from '@/modules/groups/routing';

/** Group navigation icon with a stable selected indicator. */
export function ServerIcon({ group, isActive }: ServerIconProps) {
  return (
    <NavLink
      to={getGroupRoute(group)}
      onClick={() => HapticFeedback.medium()}
      className="cgraph-server-icon"
      aria-label={group.name}
      aria-current={isActive ? 'page' : undefined}
      title={group.name}
    >
      <span className="cgraph-server-icon__indicator" aria-hidden="true" />
      <span className="cgraph-server-icon__surface">
        {group.iconUrl ? (
          <img
            src={group.iconUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-lg font-bold">{group.name.charAt(0).toUpperCase()}</span>
        )}
      </span>
    </NavLink>
  );
}
