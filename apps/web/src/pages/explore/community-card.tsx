import { ArrowRight, BadgeCheck, MessagesSquare, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCommunityRoute } from './community-routing';

export interface Community {
  id: string;
  type: 'group' | 'forum';
  name: string;
  description: string | null;
  member_count: number;
  avatar_url: string | null;
  category: string | null;
  default_channel_id?: string | null;
  defaultChannelId?: string | null;
  created_at: string | null;
  is_verified: boolean;
}

interface CommunityCardProps {
  community: Community;
}

export default function CommunityCard({ community }: CommunityCardProps) {
  const TypeIcon = community.type === 'group' ? Users : MessagesSquare;
  const typeLabel = community.type === 'group' ? 'Group' : 'Forum';

  return (
    <Link
      to={getCommunityRoute(community)}
      aria-label={`View ${community.name} ${typeLabel.toLowerCase()}`}
      className="cgraph-card group flex min-h-52 flex-col p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--token-focus-ring)]"
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--token-card-border)] bg-[var(--product-surface-selected)] text-lg font-bold text-[var(--token-interactive-primary)]">
          {community.avatar_url ? (
            <img
              src={community.avatar_url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            community.name.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-[var(--token-text-primary)]">
              {community.name}
            </h3>
            {community.is_verified && (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-[var(--token-interactive-primary)]"
                aria-label="Verified"
              />
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--token-text-muted)]">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--token-card-border)] bg-[var(--product-surface-recessed)] px-2 py-0.5 text-[10px] font-medium text-[var(--token-text-secondary)]">
              <TypeIcon className="h-3 w-3" aria-hidden="true" />
              {typeLabel}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              {community.member_count.toLocaleString()}{' '}
              {community.member_count === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>
      </div>

      {community.description && (
        <p className="mb-3 line-clamp-2 text-sm text-[var(--token-text-secondary)]">
          {community.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--token-card-border)] pt-3">
        {community.category ? (
          <span className="rounded-full bg-[var(--product-surface-recessed)] px-2.5 py-0.5 text-xs text-[var(--token-text-muted)]">
            {community.category}
          </span>
        ) : (
          <span />
        )}

        <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--token-interactive-primary)]">
          View {typeLabel.toLowerCase()}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
