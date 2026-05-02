/**
 * Onboarding Tutorial Store — Zustand state for post-registration tutorial.
 *
 * Tracks which of the 4 tutorial steps are completed,
 * and handles visibility/dismissal of the tutorial checklist.
 */

import { create } from 'zustand';
import { createLogger } from '@/lib/logger';
import { http } from '@/lib/api-client';

const logger = createLogger('OnboardingStore');

/** Onboarding step completion map. */
interface OnboardingSteps {
  send_first_message: boolean;
  join_or_create_hub: boolean;
  customize_profile: boolean;
  enable_e2ee_backup: boolean;
}

/** Onboarding store state. */
interface OnboardingState {
  /** Whether the checklist is visible. */
  isVisible: boolean;
  /** Whether all steps are completed or tutorial was skipped. */
  isCompleted: boolean;
  /** Individual step completion status. */
  steps: OnboardingSteps;
  /** Loading state for API calls. */
  isLoading: boolean;
  /** Whether the card is expanded or collapsed. */
  isExpanded: boolean;
  /** Fetch the current onboarding status from the API. */
  fetchStatus: () => Promise<void>;
  /** Mark a single step as completed. */
  completeStep: (step: string) => Promise<void>;
  /** Skip the entire tutorial. */
  skipTutorial: () => Promise<void>;
  /** Toggle expanded/collapsed state. */
  toggleExpanded: () => void;
  /** Dismiss the checklist entirely. */
  dismissChecklist: () => void;
}

const DEFAULT_STEPS: OnboardingSteps = {
  send_first_message: false,
  join_or_create_hub: false,
  customize_profile: false,
  enable_e2ee_backup: false,
};

/** Zustand store for onboarding tutorial state. */
export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  isVisible: false,
  isCompleted: false,
  steps: { ...DEFAULT_STEPS },
  isLoading: false,
  isExpanded: true,

  fetchStatus: async () => {
    set({ isLoading: true });
    try {
      const res = await http.get('/api/v1/onboarding/status');
      const data = extractData(res);
      if (data) {
        const completed = Boolean(data.completed);
        set({
          isCompleted: completed,
          steps: {
            send_first_message: Boolean(data.steps?.send_first_message),
            join_or_create_hub: Boolean(data.steps?.join_or_create_hub),
            customize_profile: Boolean(data.steps?.customize_profile),
            enable_e2ee_backup: Boolean(data.steps?.enable_e2ee_backup),
          },
          isVisible: !completed,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      logger.error('Failed to fetch onboarding status:', error);
      set({ isLoading: false });
    }
  },

  completeStep: async (step: string) => {
    try {
      const res = await http.post('/api/v1/onboarding/complete-step', { step });
      const data = extractData(res);
      if (data) {
        const completed = Boolean(data.completed);
        set({
          isCompleted: completed,
          steps: {
            send_first_message: Boolean(data.steps?.send_first_message),
            join_or_create_hub: Boolean(data.steps?.join_or_create_hub),
            customize_profile: Boolean(data.steps?.customize_profile),
            enable_e2ee_backup: Boolean(data.steps?.enable_e2ee_backup),
          },
        });
        // Auto-dismiss after completing all steps (3s delay)
        if (completed) {
          setTimeout(() => {
            get().dismissChecklist();
          }, 3000);
        }
      }
    } catch (error) {
      logger.error('Failed to complete onboarding step:', error);
    }
  },

  skipTutorial: async () => {
    try {
      await http.post('/api/v1/onboarding/skip');
      set({ isCompleted: true, isVisible: false });
    } catch (error) {
      logger.error('Failed to skip onboarding tutorial:', error);
    }
  },

  toggleExpanded: () => {
    set((state) => ({ isExpanded: !state.isExpanded }));
  },

  dismissChecklist: () => {
    set({ isVisible: false });
  },
}));

/** Shape of the onboarding status response. */
interface OnboardingStatusData {
  completed?: boolean;
  steps?: {
    send_first_message?: boolean;
    join_or_create_hub?: boolean;
    customize_profile?: boolean;
    enable_e2ee_backup?: boolean;
  };
}

/** Type guard for an object with a `data` property. */
function hasDataProp(value: unknown): value is { data: unknown } {
  return value !== null && typeof value === 'object' && 'data' in value;
}

/** Type guard for onboarding status data shape. */
function isOnboardingStatusData(value: unknown): value is OnboardingStatusData {
  return value !== null && typeof value === 'object';
}

/** Extract onboarding status data from API response (handles { data: ... } nesting). */
function extractData(res: unknown): OnboardingStatusData | null {
  if (!hasDataProp(res)) return null;
  const outer = res.data;
  if (!isOnboardingStatusData(outer)) return null;
  // Handle double-nested { data: { data: ... } } from http client
  if (hasDataProp(outer)) {
    const inner = outer.data;
    if (isOnboardingStatusData(inner)) return inner;
  }
  return outer;
}
