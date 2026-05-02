import type { ReactNode } from 'react';

interface MobileOnlyFeatureProps {
  readonly feature: string;
  readonly description?: string;
}

/**
 * Placeholder shown when the user tries to open an encrypted surface
 * (direct messages, Ghost Chat) in the browser. Web is not a
 * Signal-participant device (ADR-022), so we redirect the user to the
 * mobile or desktop app.
 */
export function MobileOnlyFeature({ feature, description }: MobileOnlyFeatureProps): ReactNode {
  const body =
    description ??
    `${feature} is end-to-end encrypted. For your keys to stay secure, encrypted messaging runs only on mobile or desktop — never in the browser.`;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-2xl font-semibold">{feature} is mobile + desktop only</h2>
      <p className="text-muted-foreground max-w-md">{body}</p>
      <a
        href="https://cgraph.org/download"
        className="text-primary-foreground rounded-md bg-primary px-4 py-2 font-medium hover:opacity-90"
      >
        Get the app
      </a>
    </div>
  );
}
