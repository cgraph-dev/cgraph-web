import { describe, expect, it } from 'vitest';
import { avatarUrlFromUploadResponse } from '../avatar-upload';

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
});
