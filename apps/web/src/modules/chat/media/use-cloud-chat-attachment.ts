import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Message } from '@/modules/chat/store/chatStore.impl';
import {
  loadCloudChatAttachment,
  type VerifiedCloudChatAttachment,
} from './cloud-chat-attachment';

type AttachmentLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AttachmentIdentity {
  readonly uploadId: string;
  readonly checksum?: string;
  readonly size?: number;
  readonly localPreviewUrl?: string;
}

interface CloudChatAttachmentState {
  readonly status: AttachmentLoadStatus;
  readonly attachment: VerifiedCloudChatAttachment | null;
  readonly error: string | null;
  readonly retry: () => void;
}

function metadataString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function metadataNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function attachmentIdentity(message: Message): AttachmentIdentity | null {
  const uploadId = metadataString(message.metadata?.uploadId);
  if (!uploadId) return null;

  return {
    uploadId,
    checksum: metadataString(message.metadata?.checksum),
    size: metadataNumber(message.metadata?.size),
    localPreviewUrl: metadataString(message.metadata?.localPreviewUrl),
  };
}

/** Loads private message bytes only when policy or an explicit user action allows it. */
export function useCloudChatAttachment(
  message: Message,
  enabled: boolean
): CloudChatAttachmentState {
  const identity = useMemo(() => attachmentIdentity(message), [message]);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<AttachmentLoadStatus>('idle');
  const [attachment, setAttachment] = useState<VerifiedCloudChatAttachment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identity || !enabled) {
      setStatus('idle');
      setAttachment(null);
      setError(null);
      return;
    }

    if (identity.localPreviewUrl) {
      setStatus('ready');
      setAttachment({
        objectUrl: identity.localPreviewUrl,
        filename: metadataString(message.metadata?.filename) ?? message.content,
        contentType: metadataString(message.metadata?.mimeType) ?? 'application/octet-stream',
        size: identity.size ?? 0,
        checksum: identity.checksum ?? '',
        expiresAt: '',
      });
      setError(null);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;

    setStatus('loading');
    setAttachment(null);
    setError(null);

    void loadCloudChatAttachment({
      conversationId: message.conversationId,
      messageId: message.id,
      uploadId: identity.uploadId,
      checksum: identity.checksum,
      size: identity.size,
      signal: controller.signal,
    })
      .then((loaded) => {
        objectUrl = loaded.objectUrl;
        setAttachment(loaded);
        setStatus('ready');
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : 'Attachment could not be loaded');
        setStatus('error');
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attempt, enabled, identity, message]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  return { status, attachment, error, retry };
}
