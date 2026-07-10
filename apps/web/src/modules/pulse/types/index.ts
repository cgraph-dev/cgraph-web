/**
 * Pulse — Reputation system types
 *
 * Pulse is CGraph's per-forum reputation score. Other users emit +1/0/-1
 * entries against a user's posts and comments; the aggregated score is
 * exposed per-forum (community-scoped) plus a global tier label.
 */

import { isPulseTier } from '@cgraph-dev/shared-types';
import type { PulseTier } from '@cgraph-dev/shared-types';

export type { PulseTier } from '@cgraph-dev/shared-types';

export type PulseEntryValue = 1 | 0 | -1;

/**
 * Aggregated Pulse score for a user, optionally scoped to a forum.
 * `forumId === null` means a global aggregate across every community.
 */
export interface PulseScore {
  readonly forumId: string | null;
  readonly forumName: string | null;
  readonly score: number;
  readonly tier: PulseTier;
}

/**
 * A single Pulse history entry (one user voting on another's post/comment).
 */
export interface PulseEntry {
  readonly id: string;
  readonly value: PulseEntryValue;
  readonly comment: string | null;
  readonly fromUserId: string;
  readonly toUserId: string;
  readonly postId: string | null;
  readonly createdAt: string;
}

/**
 * Per-user, per-forum leaderboard row. `tier` is loosely typed because the
 * server may introduce new tiers ahead of the client.
 */
export interface PulseLeaderEntry {
  readonly userId: string;
  readonly username: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly score: number;
  readonly tier: string;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPulseEntryValue(value: unknown): value is PulseEntryValue {
  return value === 1 || value === 0 || value === -1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Pick the camelCase or snake_case variant from a record. Both keys may be
 * present in dev fixtures; prefer camelCase when both exist.
 */
function pick(record: Record<string, unknown>, camel: string, snake: string): unknown {
  if (camel in record) return record[camel];
  if (snake in record) return record[snake];
  return undefined;
}

/**
 * Normalize a wire-shape PulseScore record into the camelCase domain type.
 * Returns `null` when any required field is missing or has the wrong shape —
 * the caller decides how to surface that.
 */
export function normalizePulseScore(value: unknown): PulseScore | null {
  if (!isRecord(value)) return null;
  const forumId = pick(value, 'forumId', 'forum_id');
  const forumName = pick(value, 'forumName', 'forum_name');
  const score = value.score;
  const tier = value.tier;

  if (!isStringOrNull(forumId)) return null;
  if (!isStringOrNull(forumName)) return null;
  if (!isNumber(score)) return null;
  if (!isPulseTier(tier)) return null;

  return { forumId, forumName, score, tier };
}

/**
 * Type guard wrapper around `normalizePulseScore`.
 */
export function isPulseScore(value: unknown): value is PulseScore {
  return normalizePulseScore(value) !== null;
}

/**
 * Normalize a wire-shape PulseEntry row into the camelCase domain type.
 */
export function normalizePulseEntry(value: unknown): PulseEntry | null {
  if (!isRecord(value)) return null;
  const id = value.id;
  const entryValue = value.value;
  const comment = value.comment ?? null;
  const fromUserId = pick(value, 'fromUserId', 'from_user_id');
  const toUserId = pick(value, 'toUserId', 'to_user_id');
  const postIdRaw = pick(value, 'postId', 'post_id');
  const postId = postIdRaw === undefined ? null : postIdRaw;
  const createdAt = pick(value, 'createdAt', 'created_at');

  if (!isString(id)) return null;
  if (!isPulseEntryValue(entryValue)) return null;
  if (!isStringOrNull(comment)) return null;
  if (!isString(fromUserId)) return null;
  if (!isString(toUserId)) return null;
  if (!isStringOrNull(postId)) return null;
  if (!isString(createdAt)) return null;

  return { id, value: entryValue, comment, fromUserId, toUserId, postId, createdAt };
}

/**
 * Type guard wrapper around `normalizePulseEntry`.
 */
export function isPulseEntry(value: unknown): value is PulseEntry {
  return normalizePulseEntry(value) !== null;
}

/**
 * Normalize a wire-shape PulseLeaderEntry row into the camelCase domain type.
 */
export function normalizePulseLeaderEntry(value: unknown): PulseLeaderEntry | null {
  if (!isRecord(value)) return null;
  const userId = pick(value, 'userId', 'user_id');
  const username = value.username;
  const displayNameRaw = pick(value, 'displayName', 'display_name');
  const displayName = displayNameRaw === undefined ? null : displayNameRaw;
  const avatarUrlRaw = pick(value, 'avatarUrl', 'avatar_url');
  const avatarUrl = avatarUrlRaw === undefined ? null : avatarUrlRaw;
  const score = value.score;
  const tier = value.tier;

  if (!isString(userId)) return null;
  if (!isString(username)) return null;
  if (!isStringOrNull(displayName)) return null;
  if (!isStringOrNull(avatarUrl)) return null;
  if (!isNumber(score)) return null;
  if (!isString(tier)) return null;

  return { userId, username, displayName, avatarUrl, score, tier };
}

/**
 * Type guard wrapper around `normalizePulseLeaderEntry`.
 */
export function isPulseLeaderEntry(value: unknown): value is PulseLeaderEntry {
  return normalizePulseLeaderEntry(value) !== null;
}
