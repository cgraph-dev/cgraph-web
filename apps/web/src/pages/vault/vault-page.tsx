/**
 * Vault route owner.
 *
 * The web Vault is backed by the authenticated user's server-owned
 * Note-to-Self conversation.
 */

import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { http } from '@/lib/api-client';
import { ensureObject } from '@/lib/api-utils';
import { normalizeConversation } from '@/lib/api-utils/normalizers';
import { createLogger } from '@/lib/logger';
import { MobileOnlyFeature } from '@/components/mobile-only-feature';
import {
  CloudConversation,
  ConversationLoadingState,
} from '@/modules/chat/components/cloud-conversation';
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
    return <ConversationLoadingState label="Opening Vault" />;
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
      <CloudConversation />
    </main>
  );
}
