import Skeleton from '../skeleton';

/**
 * Stable application-shell placeholder used while a lazy route is loading.
 * Its geometry mirrors the navigation rail, list pane, and route workspace so
 * navigation never falls through to a blank viewport.
 */
export function RouteSkeleton() {
  return (
    <div
      aria-label="Loading page"
      aria-live="polite"
      className="cgraph-route-skeleton cgraph-app-shell"
      data-testid="route-skeleton"
    >
      <aside className="cgraph-route-skeleton__rail cgraph-navigation-rail" aria-hidden="true">
        <Skeleton variant="circular" width={40} height={40} />
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} variant="rectangular" width={40} height={40} />
        ))}
      </aside>

      <aside className="cgraph-route-skeleton__pane cgraph-pane" aria-hidden="true">
        <div className="cgraph-route-skeleton__pane-header">
          <Skeleton variant="text" width="42%" height={20} />
          <Skeleton variant="rectangular" width={40} height={40} />
        </div>
        <Skeleton variant="rectangular" width="100%" height={40} />
        <div className="cgraph-route-skeleton__rows">
          {Array.from({ length: 7 }, (_, index) => (
            <div className="cgraph-route-skeleton__row" key={index}>
              <Skeleton variant="circular" width={40} height={40} />
              <div className="cgraph-route-skeleton__row-copy">
                <Skeleton variant="text" width={`${58 + (index % 3) * 9}%`} height={14} />
                <Skeleton variant="text" width={`${72 - (index % 2) * 12}%`} height={12} />
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="cgraph-route-skeleton__workspace cgraph-workspace" aria-hidden="true">
        <div className="cgraph-route-skeleton__content cgraph-content">
          <div className="cgraph-route-skeleton__title">
            <Skeleton variant="text" width="28%" height={26} />
            <Skeleton variant="text" width="46%" height={14} />
          </div>
          <div className="cgraph-route-skeleton__cards">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="cgraph-card cgraph-route-skeleton__card" key={index}>
                <Skeleton variant="text" width={`${34 + index * 8}%`} height={16} />
                <Skeleton variant="text" lines={3} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default RouteSkeleton;
