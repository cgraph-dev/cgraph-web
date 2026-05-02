interface AriaLiveRegionProps {
  readonly politeness?: 'polite' | 'assertive';
  readonly relevant?: React.AriaAttributes['aria-relevant'];
}
/** Aria Live Region. */
export function AriaLiveRegion({
  politeness = 'polite',
  relevant = 'additions text',
}: AriaLiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-relevant={relevant}
      aria-atomic="true"
      id="aria-live-region"
      className="sr-only"
    />
  );
}

/** Announce a message to screen readers via the polite live region. */
export function useAnnounce(): (message: string) => void {
  return (message: string) => {
    const region = document.getElementById('aria-live-region');
    if (!region) return;

    // Clear then set to force re-announcement
    region.textContent = '';
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  };
}

/** Assertive live region for urgent announcements (errors, critical alerts). */
export function AssertiveLiveRegion() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      id="aria-live-region-assertive"
      className="sr-only"
    />
  );
}

/** Announce an urgent message via the assertive live region. */
export function announceUrgent(message: string): void {
  const region = document.getElementById('aria-live-region-assertive');
  if (!region) return;

  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
