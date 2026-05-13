import { http } from '@/lib/api-client';
import {
  ensureArray,
  ensureObject,
  isRecord,
  asString,
  asNumber,
  asBool,
  asStringOrNull,
} from '@/lib/api-utils';
import type { PremiumPost, CreatePremiumPostPayload } from '@/modules/groups/types/premium-post';

function normalizeAuthor(raw: unknown): PremiumPost['author'] {
  const obj = isRecord(raw) ? raw : {};
  return {
    id: asString(obj.id),
    username: asString(obj.username),
    displayName: asStringOrNull(obj.display_name ?? obj.displayName),
    avatarUrl: asStringOrNull(obj.avatar_url ?? obj.avatarUrl),
  };
}

function normalizePremiumPost(raw: unknown): PremiumPost {
  const obj = isRecord(raw) ? raw : {};
  return {
    id: asString(obj.id),
    groupId: asString(obj.group_id ?? obj.groupId),
    title: asString(obj.title),
    content: asString(obj.content),
    mediaUrls: ensureArray<string>(obj, 'media_urls'),
    priceNodes: asNumber(obj.price_nodes ?? obj.priceNodes),
    previewLength: asNumber(obj.preview_length ?? obj.previewLength, 200),
    purchaseCount: asNumber(obj.purchase_count ?? obj.purchaseCount),
    purchased: asBool(obj.purchased),
    isAuthor: asBool(obj.is_author ?? obj.isAuthor),
    author: normalizeAuthor(obj.author),
    insertedAt: asString(obj.inserted_at ?? obj.insertedAt),
  };
}

/**
 *
 * Description.
 */
export async function listPremiumPosts(groupId: string): Promise<PremiumPost[]> {
  const res = await http.get(`/api/v1/groups/${groupId}/premium-posts`);
  const rawPosts = ensureArray<Record<string, unknown>>(res.data);
  return rawPosts.map(normalizePremiumPost);
}

/**
 *
 * Description.
 */
export async function getPremiumPost(postId: string): Promise<PremiumPost> {
  const res = await http.get(`/api/v1/premium-posts/${postId}`);
  const raw = ensureObject<Record<string, unknown>>(res.data);
  return normalizePremiumPost(raw);
}

/**
 *
 * Description.
 */
export async function createPremiumPost(
  groupId: string,
  payload: CreatePremiumPostPayload
): Promise<PremiumPost> {
  const res = await http.post(`/api/v1/groups/${groupId}/premium-posts`, {
    title: payload.title,
    content: payload.content,
    media_urls: payload.mediaUrls,
    price_nodes: payload.priceNodes,
    preview_length: payload.previewLength,
  });
  const raw = ensureObject<Record<string, unknown>>(res.data);
  return normalizePremiumPost(raw);
}

/**
 *
 * Description.
 */
export async function purchasePremiumPost(postId: string): Promise<PremiumPost> {
  const res = await http.post(`/api/v1/premium-posts/${postId}/purchase`);
  const raw = ensureObject<Record<string, unknown>>(res.data);
  return normalizePremiumPost(raw);
}
