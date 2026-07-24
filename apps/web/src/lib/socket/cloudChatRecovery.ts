import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import {
  getCloudChatEventCursor,
  setCloudChatEventCursor,
} from '@/lib/offline/indexeddb-cache';
import { z } from 'zod';

const logger = createLogger('CloudChatRecovery');
const CLOUD_CHAT_STREAM = 'cloud_chat';
const CLOUD_CHAT_EVENT_PAGE_LIMIT = 200;

const nonEmptyStringSchema = z.string().trim().min(1);
const cloudChatEventSchema = z
  .object({
    streamSeq: z.number().int().positive(),
    eventType: z.literal('message.sent'),
    aggregateType: z.literal('message'),
    aggregateId: nonEmptyStringSchema,
    payload: z
      .object({
        conversation_id: nonEmptyStringSchema,
      })
      .passthrough(),
    occurredAt: nonEmptyStringSchema,
  })
  .passthrough();

const cloudChatEventPageSchema = z.object({
  data: z.object({
    stream: z.literal(CLOUD_CHAT_STREAM),
    events: z.array(cloudChatEventSchema),
    hasMore: z.boolean(),
    nextStreamSeq: z.number().int().nonnegative(),
  }),
});

type CloudChatEventPage = z.infer<typeof cloudChatEventPageSchema>['data'];

export interface CloudChatRecoveryProjection {
  readonly getActiveConversationId: () => string | null;
  readonly refreshConversations: () => Promise<void>;
  readonly refreshMessages: (conversationId: string) => Promise<void>;
}

const recoveryByAccountId = new Map<string, Promise<void>>();

function cloudChatEventsPath(afterStreamSeq: number): string {
  const params = new URLSearchParams({
    after_stream_seq: String(afterStreamSeq),
    limit: String(CLOUD_CHAT_EVENT_PAGE_LIMIT),
  });

  return `/api/v1/sync/cloud-chat/events?${params.toString()}`;
}

function assertOrderedPage(page: CloudChatEventPage, afterStreamSeq: number): void {
  let previousStreamSeq = afterStreamSeq;

  for (const event of page.events) {
    if (event.streamSeq <= previousStreamSeq) {
      throw new Error('Cloud Chat recovery response is not strictly ordered');
    }
    previousStreamSeq = event.streamSeq;
  }

  if (page.events.length === 0) {
    if (page.hasMore || page.nextStreamSeq !== afterStreamSeq) {
      throw new Error('Cloud Chat recovery response cannot advance an empty page');
    }
    return;
  }

  if (page.nextStreamSeq !== previousStreamSeq) {
    throw new Error('Cloud Chat recovery response has an invalid next stream sequence');
  }
}

async function recoverPage(
  afterStreamSeq: number,
  projection: CloudChatRecoveryProjection
): Promise<{ hasMore: boolean; nextStreamSeq: number }> {
  const response = await http.get<unknown>(cloudChatEventsPath(afterStreamSeq));
  const page = cloudChatEventPageSchema.parse(response.data).data;
  assertOrderedPage(page, afterStreamSeq);

  if (page.events.length === 0) {
    return { hasMore: false, nextStreamSeq: afterStreamSeq };
  }

  const affectedConversationIds = new Set(
    page.events.map((event) => event.payload.conversation_id)
  );

  await projection.refreshConversations();

  const activeConversationId = projection.getActiveConversationId();
  if (activeConversationId && affectedConversationIds.has(activeConversationId)) {
    await projection.refreshMessages(activeConversationId);
  }

  return { hasMore: page.hasMore, nextStreamSeq: page.nextStreamSeq };
}

async function recoverAccountCloudChat(
  accountId: string,
  projection: CloudChatRecoveryProjection
): Promise<void> {
  let afterStreamSeq = await getCloudChatEventCursor(accountId);
  let hasMore = true;

  while (hasMore) {
    const page = await recoverPage(afterStreamSeq, projection);

    if (page.nextStreamSeq === afterStreamSeq) {
      return;
    }

    await setCloudChatEventCursor(accountId, page.nextStreamSeq);
    afterStreamSeq = page.nextStreamSeq;
    hasMore = page.hasMore;
  }
}

/**
 * Reconcile the authoritative Cloud Chat event suffix after a user-channel
 * resume. One account owns one in-flight pass, so socket replay and reconnect
 * cannot create competing history refreshes or cursor writes.
 */
export function recoverCloudChatEvents(
  accountId: string,
  projection: CloudChatRecoveryProjection
): Promise<void> {
  const normalizedAccountId = nonEmptyStringSchema.parse(accountId);
  const existingRecovery = recoveryByAccountId.get(normalizedAccountId);

  if (existingRecovery) {
    return existingRecovery;
  }

  const recovery = recoverAccountCloudChat(normalizedAccountId, projection);
  recoveryByAccountId.set(normalizedAccountId, recovery);
  recovery.then(
    () => {
      if (recoveryByAccountId.get(normalizedAccountId) === recovery) {
        recoveryByAccountId.delete(normalizedAccountId);
      }
    },
    (error: unknown) => {
      if (recoveryByAccountId.get(normalizedAccountId) === recovery) {
        recoveryByAccountId.delete(normalizedAccountId);
      }
      logger.warn('Cloud Chat recovery failed', error);
    }
  );

  return recovery;
}
