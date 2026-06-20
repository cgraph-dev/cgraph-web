import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/api-client';
import { avatarUrlFromUploadResponse, uploadCurrentUserAvatarAndSync } from '../avatar-upload';

vi.mock('@/lib/api-client', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedHttp = vi.mocked(http);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('avatarUrlFromUploadResponse', () => {
  it('reads direct snake_case avatar URLs', () => {
    expect(avatarUrlFromUploadResponse({ avatar_url: '/uploads/avatar.jpg' })).toBe(
      '/uploads/avatar.jpg'
    );
  });

  it('reads direct camelCase avatar URLs', () => {
    expect(avatarUrlFromUploadResponse({ avatarUrl: '/uploads/avatar.jpg' })).toBe(
      '/uploads/avatar.jpg'
    );
  });

  it('reads nested data camelCase avatar URLs', () => {
    expect(avatarUrlFromUploadResponse({ data: { avatarUrl: '/uploads/avatar.jpg' } })).toBe(
      '/uploads/avatar.jpg'
    );
  });

  it('reads nested data snake_case avatar URLs from user show responses', () => {
    expect(avatarUrlFromUploadResponse({ data: { avatar_url: '/uploads/avatar.jpg' } })).toBe(
      '/uploads/avatar.jpg'
    );
  });

  it('reads legacy avatar_hash media paths from user show responses', () => {
    expect(avatarUrlFromUploadResponse({ data: { avatar_hash: '/uploads/avatar.jpg' } })).toBe(
      '/uploads/avatar.jpg'
    );
  });

  it('reads nested user avatar URLs from show responses', () => {
    expect(
      avatarUrlFromUploadResponse({ data: { user: { avatarUrl: '/uploads/avatar.jpg' } } })
    ).toBe('/uploads/avatar.jpg');
  });

  it('reads nested user snake_case avatar URLs from show responses', () => {
    expect(
      avatarUrlFromUploadResponse({ data: { user: { avatar_url: '/uploads/avatar.jpg' } } })
    ).toBe('/uploads/avatar.jpg');
  });

  it('reads top-level user avatar URLs from wrapped responses', () => {
    expect(avatarUrlFromUploadResponse({ user: { avatar_url: '/uploads/avatar.jpg' } })).toBe(
      '/uploads/avatar.jpg'
    );
  });

  it('reads profile avatar URLs from wrapped responses', () => {
    expect(
      avatarUrlFromUploadResponse({ data: { profile: { avatar_url: '/uploads/avatar.jpg' } } })
    ).toBe('/uploads/avatar.jpg');
  });

  it('returns null when the response has no avatar URL', () => {
    expect(avatarUrlFromUploadResponse({ data: { user: {} } })).toBeNull();
  });

  it('uploads cropped avatars as multipart form data', async () => {
    const userPayload = {
      data: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'tricker',
        display_name: 'tricker',
        avatar_url: '/uploads/avatars/user-1/avatar-123.png',
      },
    };
    mockedHttp.post.mockResolvedValueOnce({ data: userPayload });
    mockedHttp.get.mockResolvedValueOnce({ data: userPayload });

    const result = await uploadCurrentUserAvatarAndSync(
      new Blob(['avatar-bytes'], { type: 'image/jpeg' })
    );

    expect(mockedHttp.post).toHaveBeenCalledWith(
      '/api/v1/me/avatar',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    const [, formData] = mockedHttp.post.mock.calls[0];
    expect((formData as FormData).get('file')).toBeInstanceOf(File);
    expect(result.avatarUrl).toBe('/uploads/avatars/user-1/avatar-123.png');
  });
});
