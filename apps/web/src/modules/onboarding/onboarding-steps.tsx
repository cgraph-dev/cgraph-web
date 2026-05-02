/**
 * Onboarding step definitions — the 4 post-registration tutorial steps.
 *
 * Each step has a title, description, icon, and navigation target.
 * Matches the "first 10 minutes" user experience.
 */

import {
  ChatBubbleLeftRightIcon,
  UsersIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

/** Valid onboarding step keys matching the backend step names. */
export type OnboardingStepKey =
  | 'send_first_message'
  | 'join_or_create_hub'
  | 'customize_profile'
  | 'enable_e2ee_backup';

/** Shape of a single onboarding tutorial step definition. */
export interface OnboardingStepDef {
  /** Unique identifier matching the backend step name. */
  key: OnboardingStepKey;
  /** Human-readable step title. */
  title: string;
  /** Short description of the step. */
  description: string;
  /** Step icon component. */
  icon: React.ReactNode;
  /** Navigation path for the "Do it" link. */
  navigateTo: string;
}

/** The 4 post-registration tutorial steps. */
export const ONBOARDING_STEPS: readonly OnboardingStepDef[] = [
  {
    key: 'send_first_message',
    title: 'Send your first message',
    description: 'Start a conversation with a friend.',
    icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
    navigateTo: '/chat',
  },
  {
    key: 'join_or_create_hub',
    title: 'Join or create a Hub',
    description: 'Find communities that interest you.',
    icon: <UsersIcon className="h-5 w-5" />,
    navigateTo: '/discovery',
  },
  {
    key: 'customize_profile',
    title: 'Customize your profile',
    description: 'Add an avatar and bio.',
    icon: <UserCircleIcon className="h-5 w-5" />,
    navigateTo: '/settings/profile',
  },
  {
    key: 'enable_e2ee_backup',
    title: 'Secure your messages',
    description: 'Enable encrypted backup.',
    icon: <ShieldCheckIcon className="h-5 w-5" />,
    navigateTo: '/settings/security',
  },
] as const;
