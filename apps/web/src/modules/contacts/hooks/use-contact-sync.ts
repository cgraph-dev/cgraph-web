import { useCallback, useRef } from 'react';
import { useContactStore } from '../store/contact-store';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';

const MAX_BATCH_SIZE = 1000;

/**
 * Hash a phone number using SHA-256 (Web Crypto API).
 * Normalizes to E.164 before hashing.
 */
async function hashPhone(phone: string): Promise<string> {
  const normalized = phone.replace(/[\s\-()]/g, '').replace(/^([^+])/, '+$1');
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hook for triggering contact sync and tracking progress.
 *
 * @see Signal ContactDiscovery.refreshAll
 */
export function useContactSync() {
  const {
    setSyncing,
    setSyncError,
    setContacts,
    setSyncStatus,
    setSyncToken,
    addNewContacts,
    lastSyncToken,
  } = useContactStore();

  const abortRef = useRef<AbortController | null>(null);

  /**
   * Perform a full contact sync.
   * Accepts an array of E.164 phone numbers from the user's address book.
   */
  const fullSync = useCallback(
    async (phoneNumbers: readonly string[]) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      setSyncing(true);
      setSyncError(null);

      try {
        const hashes = await Promise.all(phoneNumbers.map(hashPhone));

        // Split into batches of MAX_BATCH_SIZE
        const batches: string[][] = [];
        for (let i = 0; i < hashes.length; i += MAX_BATCH_SIZE) {
          batches.push(hashes.slice(i, i + MAX_BATCH_SIZE));
        }

        const allMatches: Array<{
          phone_hash: string;
          user: {
            id: string;
            username: string | null;
            display_name: string | null;
            avatar_url: string | null;
            is_verified: boolean;
          };
        }> = [];
        let latestToken = '';

        for (const batch of batches) {
          const result = await apiClient.contacts.sync(batch);
          if (result.ok) {
            allMatches.push(...result.data.matches);
            latestToken = result.data.sync_token;
          }
        }

        const contacts = allMatches.map((m) => ({
          user_id: m.user.id,
          username: m.user.username,
          display_name: m.user.display_name,
          avatar_url: m.user.avatar_url,
          is_verified: m.user.is_verified,
          discovered_at: new Date().toISOString(),
        }));

        setContacts(contacts);
        setSyncToken(latestToken);

        // Refresh sync status
        const statusResult = await apiClient.contacts.getSyncStatus();
        if (statusResult.ok) {
          setSyncStatus(statusResult.data);
        }

        logger.info('Contact sync complete', { count: contacts.length });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Contact sync failed';
        setSyncError(message);
        logger.error('Contact sync failed', { error: message });
      } finally {
        setSyncing(false);
      }
    },
    [setSyncing, setSyncError, setContacts, setSyncToken, setSyncStatus]
  );

  /**
   * Perform an incremental sync with new phone numbers only.
   */
  const incrementalSync = useCallback(
    async (newPhoneNumbers: readonly string[]) => {
      if (!lastSyncToken) {
        return fullSync(newPhoneNumbers);
      }

      setSyncing(true);
      setSyncError(null);

      try {
        const hashes = await Promise.all(newPhoneNumbers.map(hashPhone));
        const result = await apiClient.contacts.sync(hashes, lastSyncToken);

        if (result.ok) {
          const newContacts = result.data.matches.map((m) => ({
            user_id: m.user.id,
            username: m.user.username,
            display_name: m.user.display_name,
            avatar_url: m.user.avatar_url,
            is_verified: m.user.is_verified,
            discovered_at: new Date().toISOString(),
          }));

          addNewContacts(newContacts);
          setSyncToken(result.data.sync_token);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Incremental sync failed';
        setSyncError(message);
      } finally {
        setSyncing(false);
      }
    },
    [fullSync, lastSyncToken, setSyncing, setSyncError, addNewContacts, setSyncToken]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setSyncing(false);
  }, [setSyncing]);

  return { fullSync, incrementalSync, cancel, hashPhone } as const;
}
