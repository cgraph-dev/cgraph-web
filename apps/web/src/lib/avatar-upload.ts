import { http } from '@/lib/api-client';
import { asString, isRecord } from '@/lib/api-utils';
import { resolveAvatarUrl, resolveAvatarUrlFromRecord } from '@/lib/media-url';
import type { User } from '@/modules/auth/store/authStore.types';
import { mapUserFromApi } from '@/modules/auth/store/authStore.utils';

export interface CurrentUserAvatarUploadResult {
  avatarUrl: string;
  user: User | null;
  rawUser: Record<string, unknown> | null;
}

function avatarUrlFromRecord(record: Record<string, unknown>): string | null {
  return resolveAvatarUrlFromRecord(record, ['url']);
}

function looksLikeUserRecord(
  record: Record<string, unknown> | null
): record is Record<string, unknown> {
  return Boolean(
    record &&
      (asString(record.id) ||
        asString(record.uid) ||
        asString(record.email) ||
        asString(record.username))
  );
}

function avatarResponseRecords(responseData: unknown): Record<string, unknown>[] {
  if (!isRecord(responseData)) return [];

  const records: Record<string, unknown>[] = [responseData];
  const data = isRecord(responseData.data) ? responseData.data : null;
  const topLevelUser = isRecord(responseData.user) ? responseData.user : null;

  if (data) {
    records.push(data);

    if (isRecord(data.user)) records.push(data.user);
    if (isRecord(data.profile)) records.push(data.profile);
  }

  if (topLevelUser) records.push(topLevelUser);

  return records;
}

export function userRecordFromApiResponse(responseData: unknown): Record<string, unknown> | null {
  if (!isRecord(responseData)) return null;

  const data = isRecord(responseData.data) ? responseData.data : null;
  if (data) {
    if (isRecord(data.user)) return data.user;
    return data;
  }

  if (isRecord(responseData.user)) return responseData.user;
  if (isRecord(responseData.profile)) return responseData.profile;

  return responseData;
}

/** Extracts an avatar URL from the supported backend upload response shapes. */
export function avatarUrlFromUploadResponse(responseData: unknown): string | null {
  for (const record of avatarResponseRecords(responseData)) {
    const avatarUrl = avatarUrlFromRecord(record);
    if (avatarUrl) return resolveAvatarUrl(avatarUrl);
  }

  return null;
}

async function fetchCurrentUserRecord(): Promise<Record<string, unknown> | null> {
  const response = await http.get('/api/v1/me');
  return userRecordFromApiResponse(response.data);
}

/** Uploads a cropped avatar blob and returns the canonical current-user data. */
export async function uploadCurrentUserAvatarAndSync(
  blob: Blob
): Promise<CurrentUserAvatarUploadResult> {
  const formData = new FormData();
  formData.append('file', blob, 'avatar.jpg');

  const response = await http.post('/api/v1/me/avatar', formData);
  const uploadRecord = userRecordFromApiResponse(response.data);
  const uploadAvatarUrl = avatarUrlFromUploadResponse(response.data);

  let rawUser = uploadRecord;
  try {
    rawUser = (await fetchCurrentUserRecord()) ?? uploadRecord;
  } catch {
    rawUser = uploadRecord;
  }

  const canonicalAvatarUrl =
    (rawUser ? avatarUrlFromUploadResponse(rawUser) : null) ?? uploadAvatarUrl;
  const avatarUrl = resolveAvatarUrl(canonicalAvatarUrl);
  if (!avatarUrl) throw new Error('Avatar upload response did not include avatar URL');

  return {
    avatarUrl,
    rawUser,
    user: looksLikeUserRecord(rawUser) ? mapUserFromApi(rawUser) : null,
  };
}

/** Uploads a cropped avatar blob for the authenticated user. */
export async function uploadCurrentUserAvatar(blob: Blob): Promise<string | null> {
  return (await uploadCurrentUserAvatarAndSync(blob)).avatarUrl;
}
