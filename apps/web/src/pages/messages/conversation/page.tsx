import { useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { MobileOnlyFeature } from '@/components/mobile-only-feature';
import { CloudConversation } from '@/modules/chat/components/cloud-conversation';
import { useChatStore } from '@/modules/chat/store/chatStore.impl';
import { LoadingSpinner } from '@/pages/messages/messages/empty-states';

/**
 * Direct-message conversation route.
 *
 * Branches on the conversation tier (ADR-022 / ADR-023):
 *   - `cloud`  → server-readable (AES-256-GCM + KMS). Full web UI.
 *   - `secret` → post-quantum E2EE; web is not a Signal-participant device
 *                so we render the mobile-only placeholder.
 *   - unknown  → fail closed to the mobile-only placeholder.
 */
export default function Conversation(): ReactNode {
  const { conversationId } = useParams<{ conversationId: string }>();
  const conversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === conversationId)
  );
  const isLoadingConversations = useChatStore((state) => state.isLoadingConversations);
  const fetchConversations = useChatStore((state) => state.fetchConversations);
  const [resolvedConversationId, setResolvedConversationId] = useState<string | undefined>();

  useEffect(() => {
    if (!conversationId) return;

    if (conversation) {
      setResolvedConversationId(conversationId);
      return;
    }

    let active = true;
    void fetchConversations()
      .catch(() => undefined)
      .finally(() => {
        if (active) setResolvedConversationId(conversationId);
      });

    return () => {
      active = false;
    };
  }, [conversation, conversationId, fetchConversations]);

  if (!conversation && (conversationId !== resolvedConversationId || isLoadingConversations)) {
    return (
      <div
        className="flex h-full flex-1 items-center justify-center"
        role="status"
        aria-label="Loading conversation"
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (conversation?.conversationType === 'cloud') {
    return <CloudConversation />;
  }

  const isSecret = conversation?.conversationType === 'secret';
  const feature = isSecret ? 'Secret Chat' : 'Direct Messages';
  const description = isSecret
    ? 'Secret Chats use post-quantum end-to-end encryption that runs only on mobile or desktop. Install the app to read this conversation.'
    : 'To open this conversation, pick a tier when you start it: a Cloud Chat works on every platform including web, while a Secret Chat is post-quantum end-to-end encrypted and requires the mobile or desktop app.';

  return <MobileOnlyFeature feature={feature} description={description} />;
}
