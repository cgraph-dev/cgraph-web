/**
 * Type definitions for Onboarding module
 */

export interface OnboardingStep {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
}

export interface ProfileData {
  readonly displayName: string;
  readonly bio: string;
  readonly avatarUrl: string | null;
  readonly notifyMessages: boolean;
  readonly notifyMentions: boolean;
  readonly notifyFriendRequests: boolean;
  readonly theme: 'dark' | 'light' | 'system';
}

export interface Feature {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

export type ProfileUpdatePayload = {
  readonly display_name?: string;
  readonly bio?: string;
  readonly avatar_url?: string | null;
};

export type NotificationKey = 'notifyMessages' | 'notifyMentions' | 'notifyFriendRequests';

export interface NotificationOption {
  readonly key: NotificationKey;
  readonly label: string;
  readonly desc: string;
}
