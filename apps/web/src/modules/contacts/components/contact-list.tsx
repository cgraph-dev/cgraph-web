import type { ReactNode } from 'react';
import { useContactStore } from '../store/contact-store';

interface ContactListProps {
  readonly onContactClick: (userId: string) => void;
}

/** Renders a list of synced contacts with avatars and verification badges. */
export function ContactList({ onContactClick }: ContactListProps): ReactNode {
  const contacts = useContactStore((s) => s.contacts);
  const isSyncing = useContactStore((s) => s.isSyncing);

  if (isSyncing && contacts.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center p-8">
        <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Syncing contacts...
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center p-8">
        <p className="text-lg font-medium">No contacts found</p>
        <p className="mt-1 text-sm">Sync your phone contacts to find people on CGraph.</p>
      </div>
    );
  }

  return (
    <div className="divide-border divide-y">
      {contacts.map((contact) => (
        <button
          key={contact.user_id}
          type="button"
          className="hover:bg-accent/50 flex w-full items-center gap-3 p-3 text-left transition-colors"
          onClick={() => onContactClick(contact.user_id)}
        >
          {contact.avatar_url ? (
            <img src={contact.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full font-medium text-primary">
              {(contact.display_name ?? contact.username ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {contact.display_name ?? contact.username ?? 'Unknown'}
            </p>
            {contact.username ? (
              <p className="text-muted-foreground truncate text-sm">@{contact.username}</p>
            ) : null}
          </div>
          {contact.is_verified ? (
            <span className="text-xs font-medium text-primary">Verified</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
