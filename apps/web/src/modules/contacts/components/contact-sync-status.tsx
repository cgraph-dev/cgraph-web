import type { ReactNode } from 'react';
import { useContactStore } from '../store/contact-store';

/** Displays the current contact sync status, including errors and last sync time. */
export function ContactSyncStatus(): ReactNode {
  const syncStatus = useContactStore((s) => s.syncStatus);
  const isSyncing = useContactStore((s) => s.isSyncing);
  const syncError = useContactStore((s) => s.syncError);

  if (syncError) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
        Sync failed: {syncError}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="bg-primary/10 flex items-center gap-2 rounded-md p-3 text-sm text-primary">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Syncing contacts...
      </div>
    );
  }

  if (!syncStatus) {
    return (
      <div className="bg-muted text-muted-foreground rounded-md p-3 text-sm">
        Contacts not yet synced. Tap to sync your phone contacts.
      </div>
    );
  }

  const lastSync = syncStatus.last_sync_at
    ? new Date(syncStatus.last_sync_at).toLocaleDateString()
    : 'Never';

  return (
    <div className="bg-muted rounded-md p-3 text-sm">
      <p>{syncStatus.registered_contact_count} contacts on CGraph</p>
      <p className="text-muted-foreground">Last synced: {lastSync}</p>
    </div>
  );
}
