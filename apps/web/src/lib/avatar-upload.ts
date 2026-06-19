import { http } from '@/lib/api-client';
import { asString, isRecord } from '@/lib/api-utils';
import { resolveAvatarUrl } from '@/lib/media-url';

/** Extracts an avatar URL from the supported backend upload response shapes. */
export function avatarUrlFromUploadResponse(responseData: unknown): string | null {
  if (!isRecord(responseData)) return null;

  const direct =
    asString(responseData.avatar_url) || asString(responseData.avatarUrl) || asString(responseData.url);
  if (direct) return resolveAvatarUrl(direct);

  const data = isRecord(responseData.data) ? responseData.data : null;
  if (!data) return null;

  const dataDirect = asString(data.avatar_url) || asString(data.avatarUrl) || asString(data.url);
  if (dataDirect) return resolveAvatarUrl(dataDirect);

  const user = isRecord(data.user) ? data.user : null;
  if (!user) return null;

  return resolveAvatarUrl(asString(user.avatar_url) || asString(user.avatarUrl));
}

/** Uploads a cropped avatar blob for the authenticated user. */
export async function uploadCurrentUserAvatar(blob: Blob): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', blob, 'avatar.jpg');

  const response = await http.post('/api/v1/me/avatar', formData);

  return avatarUrlFromUploadResponse(response.data);
}
