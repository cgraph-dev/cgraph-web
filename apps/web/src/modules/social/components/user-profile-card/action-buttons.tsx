import { memo } from 'react';

import { cn } from '@/lib/utils';
import {
  friendshipActionLabel,
  isRelationshipActionDisabled,
} from '@/modules/social/friendship-status';

import type { ActionButtonsProps, ProfileCardFriendshipStatus } from './types';
const GLASS_BASE =
  'group/btn relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-[14px] px-2 py-3 transition-transform duration-150 active:scale-[0.96]';

const GLASS_BORDER: React.CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.15)',
  borderLeft: '1px solid rgba(255,255,255,0.08)',
  borderRight: '1px solid rgba(0,0,0,0.25)',
  borderBottom: '1px solid rgba(0,0,0,0.3)',
  backdropFilter: 'blur(12px) saturate(1.4)',
};
function ChatIcon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[13px] w-[13px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function StarIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function UserPlusIcon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[13px] w-[13px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function ExternalLinkIcon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function relationshipLabel(
  friendshipStatus: ProfileCardFriendshipStatus,
  isPending: boolean
): string {
  if (!isPending && friendshipStatus === 'none') return 'Add Friend';
  return friendshipActionLabel(friendshipStatus, isPending);
}

function relationshipClickHandler(
  friendshipStatus: ProfileCardFriendshipStatus,
  onAddFriend: () => void,
  onReviewFriendRequest: () => void
): () => void {
  return friendshipStatus === 'pending_received' ? onReviewFriendRequest : onAddFriend;
}
export const ActionButtons = memo(function ActionButtons({
  onMessage,
  onTip,
  onAddFriend,
  onReviewFriendRequest,
  onViewProfile,
  accentColor,
  tipEnabled,
  friendshipStatus,
  isFriendActionPending = false,
  compact,
}: ActionButtonsProps) {
  const viewProfileStyle: React.CSSProperties & { '--pc-accent': string } = {
    '--pc-accent': accentColor,
  };
  const accentText = `color-mix(in srgb, ${accentColor} 60%, #edf0f8 40%)`;
  const accentBloom = `radial-gradient(ellipse at 50% 100%, color-mix(in srgb, ${accentColor} 28%, transparent) 0%, rgba(255,255,255,0.03) 70%)`;
  const actionLabel = relationshipLabel(friendshipStatus, isFriendActionPending);
  const isRelationshipDisabled = isRelationshipActionDisabled(
    friendshipStatus,
    isFriendActionPending
  );
  const handleRelationshipClick = relationshipClickHandler(
    friendshipStatus,
    onAddFriend,
    onReviewFriendRequest
  );
  const compactPrimaryIsMessage = friendshipStatus === 'friends';
  const compactPrimaryDisabled =
    !compactPrimaryIsMessage && isRelationshipDisabled;
  const compactPrimaryLabel = compactPrimaryIsMessage ? 'Message' : actionLabel;
  const handleCompactPrimaryClick = compactPrimaryIsMessage ? onMessage : handleRelationshipClick;

  if (compact) {
    return (
      <div className="px-[1.1rem] pb-[1.1rem] pt-1">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCompactPrimaryClick}
            disabled={compactPrimaryDisabled}
            className={cn(GLASS_BASE, compactPrimaryDisabled && 'cursor-default opacity-45')}
            style={{ ...GLASS_BORDER, background: accentBloom }}
          >
            <span style={{ color: accentText }}>
              {compactPrimaryIsMessage ? <ChatIcon /> : <UserPlusIcon />}
            </span>
            <span
              className="text-[10px] font-semibold tracking-[0.02em]"
              style={{ color: accentText, fontFamily: "'Inter', system-ui" }}
            >
              {compactPrimaryLabel}
            </span>
          </button>

          <button
            type="button"
            onClick={onViewProfile}
            className={cn(GLASS_BASE)}
            style={{ ...GLASS_BORDER, background: 'rgba(255,255,255,0.02)' }}
          >
            <span className="text-[#3d4d62]">
              <ExternalLinkIcon />
            </span>
            <span
              className="text-[10px] font-semibold tracking-[0.02em] text-[#3d4d62]"
              style={{ fontFamily: "'Inter', system-ui" }}
            >
              View Profile
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 3-column action grid */}
      <div className="grid grid-cols-[1fr_48px_1fr] gap-2 px-[1.1rem] pb-4">
        {/* Message */}
        <button
          type="button"
          onClick={onMessage}
          className={GLASS_BASE}
          style={{ ...GLASS_BORDER, background: accentBloom }}
        >
          <span style={{ color: accentText }}>
            <ChatIcon />
          </span>
          <span
            className="text-[10px] font-semibold tracking-[0.02em]"
            style={{ color: accentText, fontFamily: "'Inter', system-ui" }}
          >
            Message
          </span>
        </button>

        {/* Tip */}
        <button
          type="button"
          onClick={onTip}
          disabled={!tipEnabled}
          className={cn(
            GLASS_BASE,
            !tipEnabled && 'pointer-events-none opacity-20',
          )}
          style={{
            ...GLASS_BORDER,
            background:
              'radial-gradient(ellipse at 50% 100%, rgba(232,160,32,0.20) 0%, rgba(255,255,255,0.03) 70%)',
          }}
        >
          <span className="text-[#e8a020]">
            <StarIcon />
          </span>
          <span
            className="text-[10px] font-semibold tracking-[0.02em] text-[#e8a020]"
            style={{ fontFamily: "'Inter', system-ui" }}
          >
            Tip
          </span>
        </button>

        {/* Add Friend */}
        <button
          type="button"
          onClick={handleRelationshipClick}
          disabled={isRelationshipDisabled}
          className={cn(
            GLASS_BASE,
            'text-[#8896b0] hover:text-[#edf0f8]',
            isRelationshipDisabled && 'cursor-default opacity-45 hover:text-[#8896b0]'
          )}
          style={{
            ...GLASS_BORDER,
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))',
          }}
        >
          <UserPlusIcon />
          <span
            className="text-[10px] font-semibold tracking-[0.02em]"
            style={{ fontFamily: "'Inter', system-ui" }}
          >
            {actionLabel}
          </span>
        </button>
      </div>

      {/* View Profile — full width */}
      <div className="-mt-0.5 px-[1.1rem] pb-[1.1rem]">
        <button
          type="button"
          onClick={onViewProfile}
          className="group/vp relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-[12px] border border-white/[0.055] bg-white/[0.02] py-[9px] text-[#3d4d62] transition-all duration-200 hover:border-[var(--pc-accent)] hover:text-[var(--pc-accent)]"
          style={viewProfileStyle}
        >
          <ExternalLinkIcon />
          <span
            className="text-[0.72rem] font-semibold"
            style={{ fontFamily: "'Inter', system-ui" }}
          >
            View Profile
          </span>
        </button>
      </div>
    </>
  );
});
