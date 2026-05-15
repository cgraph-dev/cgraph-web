/**
 * Vault route owner.
 *
 * The web Vault is backed by the authenticated user's server-owned
 * Note-to-Self conversation.
 */

import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BookmarkIcon } from '@heroicons/react/24/solid';
import { http } from '@/lib/api-client';
import { ensureObject } from '@/lib/api-utils';
import { normalizeConversation } from '@/lib/api-utils/normalizers';
import { createLogger } from '@/lib/logger';
import { MobileOnlyFeature } from '@/components/mobile-only-feature';
import EnhancedConversation from '@/pages/messages/enhanced-conversation/enhanced-conversation';
import { LoadingSpinner } from '@/pages/messages/enhanced-conversation/loading-spinner';
import {
  toConversation,
  useChatStore,
  type Conversation,
} from '@/modules/chat/store/chatStore.impl';

const logger = createLogger('VaultPage');

/**
 * Extracts and normalizes a Vault conversation response.
 */
function conversationFromResponse(payload: unknown): Conversation {
  const wrapped = ensureObject<{ data?: unknown; conversation?: unknown }>(payload);
  const raw = ensureObject<Record<string, unknown>>(
    wrapped?.data ?? wrapped?.conversation ?? payload,
    'vault conversation'
  );

  if (!raw) {
    throw new Error('Vault response did not include a conversation');
  }

  return toConversation(normalizeConversation(raw));
}

/**
 * Fetches or creates the current user's Vault conversation.
 */
async function ensureVaultConversation(): Promise<Conversation> {
  const existing = useChatStore.getState().conversations.find((conversation) => {
    return conversation.isNoteToSelf === true;
  });

  if (existing) {
    return existing;
  }

  const response = await http.post('/api/v1/conversations/note-to-self');
  const conversation = conversationFromResponse(response.data);
  useChatStore.getState().addConversation(conversation);
  return conversation;
}

/**
 * First-class routed Vault page.
 */
export default function VaultPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const conversations = useChatStore((state) => state.conversations);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const conversation = useMemo(
    () => conversations.find((item) => item.id === conversationId),
    [conversationId, conversations]
  );

  useEffect(() => {
    let isActive = true;

    void ensureVaultConversation()
      .then((vaultConversation) => {
        if (!isActive) return;
        if (conversationId !== vaultConversation.id) {
          navigate(`/vault/${vaultConversation.id}`, { replace: true });
          return;
        }
        setStatus('ready');
      })
      .catch((error: unknown) => {
        logger.error('Failed to open Vault conversation:', error);
        if (isActive) setStatus('error');
      });

    return () => {
      isActive = false;
    };
  }, [conversationId, navigate]);

  if (status === 'error') {
    return (
      <MobileOnlyFeature
        feature="Vault"
        description="Vault could not be opened from the backend right now. Try again after your connection is restored."
      />
    );
  }

  if (!conversationId || (status === 'loading' && !conversation)) {
    return (
      <div
        className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 text-white"
        role="status"
        aria-label="Opening Vault"
      >
        <div className="border-primary-500/30 bg-primary-500/10 rounded-full border p-4">
          <BookmarkIcon className="h-8 w-8 text-primary-300" />
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (!conversation?.isNoteToSelf) {
    return <Navigate to="/vault" replace />;
  }

  if (conversation.conversationType !== 'cloud') {
    return (
      <MobileOnlyFeature
        feature="Vault"
        description="This Vault conversation is not available on web. Open it from mobile or desktop, or create a web Vault from the app account tied to this session."
      />
    );
  }

  return (
    <main className="flex h-full max-h-screen min-h-0 flex-1 flex-col" aria-label="Vault messages">
      <EnhancedConversation />
    </main>
  );
}
