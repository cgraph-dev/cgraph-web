import { AxiosError } from 'axios';
import type { ApiErrorResponse, User } from './authStore.types';
import type { StateStorage } from 'zustand/middleware';
import { authLogger } from '@/lib/logger';
import { identityFieldsFromApi } from '@/lib/identity';
import { resolveAvatarUrl } from '@/lib/media-url';
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = Object.fromEntries(Object.entries(value));
  return (
    (obj.error === undefined || typeof obj.error === 'string') &&
    (obj.message === undefined || typeof obj.message === 'string')
  );
}

type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';
const validStatuses = new Set<string>(['online', 'idle', 'dnd', 'offline']);

function isUserStatus(value: unknown): value is UserStatus {
  return typeof value === 'string' && validStatuses.has(value);
}

/**
 * Extract error message from API errors
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data: unknown = error.response?.data;
    if (isApiErrorResponse(data)) {
      return data.error || data.message || fallback;
    }
    return fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

/** Maps raw API user response to typed User object with safe defaults. */
export function mapUserFromApi(apiUser: Record<string, unknown>): User {
  const identity = identityFieldsFromApi(apiUser);

  return {
    id: identity.id,
    uid: isString(apiUser.uid) ? apiUser.uid : '',
    userId: isNumber(apiUser.user_id) ? apiUser.user_id : 0,
    userIdDisplay: isString(apiUser.user_id_display) ? apiUser.user_id_display : '#0000000000',
    email: isString(apiUser.email) ? apiUser.email : '',
    username: identity.username || null,
    displayName: identity.displayName,
    avatarUrl: resolveAvatarUrl(identity.avatarUrl),
    avatarBorderId: identity.avatarBorderId,
    equippedTitleId: identity.equippedTitleId,
    equippedBadgeIds: identity.equippedBadgeIds,
    equippedNameplateId: identity.equippedNameplateId,
    profileTheme: identity.profileTheme,
    chatTheme: identity.chatTheme,
    displayNameFont: identity.displayNameFont,
    displayNameEffect: identity.displayNameEffect,
    displayNameColor: identity.displayNameColor,
    displayNameSecondaryColor: identity.displayNameSecondaryColor,
    walletAddress: isString(apiUser.wallet_address) ? apiUser.wallet_address : null,
    emailVerifiedAt: isString(apiUser.email_verified_at) ? apiUser.email_verified_at : null,
    onboardingCompleted: isBoolean(apiUser.onboarding_completed)
      ? apiUser.onboarding_completed
      : true,
    twoFactorEnabled: isBoolean(apiUser.totp_enabled) ? apiUser.totp_enabled : false,
    status: isUserStatus(apiUser.status) ? apiUser.status : 'offline',
    statusMessage: isString(apiUser.custom_status) ? apiUser.custom_status : null,
    pulse: isNumber(apiUser.karma) ? apiUser.karma : 0,
    isVerified: isBoolean(apiUser.is_verified) ? apiUser.is_verified : false,
    isPremium: isBoolean(apiUser.is_premium) ? apiUser.is_premium : false,
    isAdmin: isBoolean(apiUser.is_admin) ? apiUser.is_admin : false,
    canChangeUsername: isBoolean(apiUser.can_change_username) ? apiUser.can_change_username : true,
    usernameNextChangeAt: isString(apiUser.username_next_change_at)
      ? apiUser.username_next_change_at
      : null,
    phoneNumber: isString(apiUser.phone_number) ? apiUser.phone_number : null,
    createdAt: isString(apiUser.inserted_at) ? apiUser.inserted_at : '',
    // Gamification fields
    level: isNumber(apiUser.level) ? apiUser.level : 1,
    xp: isNumber(apiUser.xp) ? apiUser.xp : 0,
    nodes: isNumber(apiUser.nodes) ? apiUser.nodes : 0,
    title: isString(apiUser.title) ? apiUser.title : undefined,
    titleColor: isString(apiUser.title_color) ? apiUser.title_color : undefined,
    badges: isStringArray(apiUser.badges) ? apiUser.badges : undefined,
    streak: isNumber(apiUser.streak) ? apiUser.streak : 0,
  };
}

/**
 * Session storage wrapper for auth persistence
 *
 * SECURITY MODEL (XSS MITIGATION):
 * ================================
 *
 * 1. PRIMARY AUTH: HTTP-only cookies
 *    - Set by backend on login/register/refresh
 *    - Automatically sent with every request (withCredentials: true)
 *    - CANNOT be accessed by JavaScript (XSS immune)
 *    - This is the primary authentication mechanism
 *
 * 2. SECONDARY: Token in sessionStorage (WebSocket ONLY)
 *    - Phoenix Channels require token in connection params
 *    - HTTP-only cookies cannot be read by JS for WebSocket auth
 *    - This is a known limitation of WebSocket authentication
 *
 * MITIGATIONS:
 *    - sessionStorage (not localStorage): cleared on browser/tab close
 *    - Base64 encoding: provides obfuscation (not encryption)
 *    - Short-lived access tokens: expire in 15 minutes
 *    - Refresh tokens: sent via HTTP-only cookie path restriction
 *    - CORS + SameSite cookie settings prevent CSRF
 *    - Content Security Policy prevents inline script injection
 *
 * ATTACK SURFACE:
 *    - An XSS attack could steal the access token (15 min lifetime)
 *    - Cannot steal refresh token (HTTP-only cookie with path restriction)
 *    - User would need to re-login after access token expires
 *
 * FUTURE IMPROVEMENT:
 *    - Consider using a short-lived WebSocket-specific token
 *    - Implement token binding to prevent token theft reuse
 */
export const createSecureStorage = (): StateStorage => {
  const encode = (data: string): string => {
    try {
      return btoa(encodeURIComponent(data));
    } catch (error) {
      authLogger.warn('Storage encode failed, using raw value', error);
      return data;
    }
  };

  const decode = (data: string): string => {
    try {
      return decodeURIComponent(atob(data));
    } catch (error) {
      authLogger.warn('Storage decode failed, using raw value', error);
      return data;
    }
  };

  return {
    getItem: (name: string): string | null => {
      const value = sessionStorage.getItem(name);
      if (!value) return null;
      try {
        return decode(value);
      } catch (error) {
        authLogger.warn('Storage getItem decode failed, returning raw value', error);
        return value;
      }
    },
    setItem: (name: string, value: string): void => {
      sessionStorage.setItem(name, encode(value));
    },
    removeItem: (name: string): void => {
      sessionStorage.removeItem(name);
    },
  };
};
