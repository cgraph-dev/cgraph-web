import type { ProfileColorId } from '@cgraph-dev/shared-types';

// Type for API error responses
export interface ApiErrorResponse {
  error?: string | { message?: string; code?: string; details?: unknown };
  message?: string;
  errors?: Record<string, string | string[]>;
}

export interface User {
  id: string;
  uid: string; // Random 10-digit UID (e.g., "4829173650")
  userId: number; // Legacy sequential ID (for backward compatibility)
  userIdDisplay: string; // Formatted UID for display (e.g., "#4829173650")
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  equippedTitleId?: string | null;
  equippedBadgeIds?: readonly string[];
  equippedNameplateId?: string | null;
  profileColor?: ProfileColorId | null;
  profileTheme?: string | null;
  chatTheme?: string | null;
  displayNameFont?: string | null;
  displayNameEffect?: string | null;
  displayNameColor?: string | null;
  displayNameSecondaryColor?: string | null;
  emailVerifiedAt: string | null;
  onboardingCompleted?: boolean;
  twoFactorEnabled: boolean;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  statusMessage: string | null;
  pulse: number;
  isVerified: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  canChangeUsername: boolean;
  usernameNextChangeAt: string | null;
  phoneNumber: string | null;
  createdAt: string;

  // Profile fields
  bio?: string;
  pronouns?: string;
  location?: string;
  website?: string;
  occupation?: string;
  bannerUrl?: string | null;

  // Gamification fields
  level?: number;
  xp?: number;
  title?: string;
  titleColor?: string;
  badges?: string[];
  streak?: number;
  nodes?: number;

  // Subscription/Premium info
  subscription?: {
    tier?: 'free' | 'premium';
    status?: 'active' | 'inactive' | 'cancelled';
    expiresAt?: string;
  } | null;
}

/** Returned by login() when user has 2FA enabled */
export interface TwoFactorRequired {
  twoFactorRequired: true;
  twoFactorToken: string;
}

export type EmailVerificationResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

export type PasswordResetResult =
  | { ok: true }
  | {
      ok: false;
      status: number | null;
      code: string | null;
      message: string;
    };

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (
    email: string,
    password: string,
    turnstileToken?: string | null
  ) => Promise<TwoFactorRequired | void>;
  verifyLoginTwoFactor: (twoFactorToken: string, code: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
    turnstileToken?: string | null
  ) => Promise<void>;
  verifyEmail: (token: string) => Promise<EmailVerificationResult>;
  requestPasswordReset: (email: string, turnstileToken?: string | null) => Promise<void>;
  resetPassword: (
    token: string,
    password: string,
    passwordConfirmation: string,
    turnstileToken?: string | null
  ) => Promise<PasswordResetResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  reset: () => void;
}
