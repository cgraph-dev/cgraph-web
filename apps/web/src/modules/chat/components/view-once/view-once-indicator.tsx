/**
 * ViewOnceIndicator — Shows the view-once state inline in a message bubble.
 *
 * Signal reference: ViewOnceMessageView.presentText()
 * States:
 * - pending (incoming): eye icon + "Photo" / "Video"
 * - pending (outgoing): eye icon + "Photo" / "Video"
 * - viewed (incoming): dashed-eye icon + "Viewed"
 * - viewed (outgoing): dashed-eye icon + "Viewed"
 * - expired: dashed-eye icon + "Expired"
 * - opening: spinner
 */
import type { ReactNode } from 'react';
import type { ViewOnceState } from '@cgraph/shared-types';

interface ViewOnceIndicatorProps {
  readonly state: ViewOnceState;
  readonly contentType: string;
  readonly isOwn: boolean;
  readonly isOpening: boolean;
}

/** Displays the current view-once state (pending, viewed, expired, or opening) inline in a message bubble. */
export function ViewOnceIndicator(props: ViewOnceIndicatorProps): ReactNode {
  const { state, contentType, isOwn, isOpening } = props;

  if (isOpening) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="text-sm opacity-70">Opening...</span>
      </div>
    );
  }

  const mediaLabel = contentType === 'video' ? 'Video' : 'Photo';

  if (state === 'viewed' || state === 'expired') {
    const label = state === 'expired' ? 'Expired' : 'Viewed';
    return (
      <div className="flex items-center gap-2 px-3 py-2 opacity-60">
        <ViewOnceDashedIcon />
        <span className="text-sm">{label}</span>
      </div>
    );
  }

  // state === 'pending'
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <ViewOnceIcon />
      <span className="text-sm font-medium">
        {isOwn ? mediaLabel : `View ${mediaLabel.toLowerCase()}`}
      </span>
    </div>
  );
}

function ViewOnceIcon(): ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="1.5" />
      <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Z" />
      <text x="19" y="8" fontSize="10" fill="currentColor" stroke="none" fontWeight="bold">
        1
      </text>
    </svg>
  );
}

function ViewOnceDashedIcon(): ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="4 2"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="1.5" />
      <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Z" />
    </svg>
  );
}
