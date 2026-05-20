import { http } from '@/lib/api-client';
import { asString, isRecord } from '@/lib/api-utils';

export function avatarUrlFromUploadResponse(responseData: unknown): string | null {
  if (!isRecord(responseData)) return null;

  const direct = asString(responseData.avatar_url) || asString(responseData.url);
  if (direct) return direct;

  const data = isRecord(responseData.data) ? responseData.data : null;
  if (!data) return null;

  const dataDirect = asString(data.avatar_url) || asString(data.url);
  if (dataDirect) return dataDirect;

  const user = isRecord(data.user) ? data.user : null;
  if (!user) return null;

  return asString(user.avatar_url) || asString(user.avatarUrl) || null;
}

export async function uploadCurrentUserAvatar(blob: Blob): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', blob, 'avatar.jpg');

  const response = await http.post('/api/v1/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return avatarUrlFromUploadResponse(response.data);
}
