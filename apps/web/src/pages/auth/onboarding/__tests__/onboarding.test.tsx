import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Onboarding from '../onboarding';

const mocks = vi.hoisted(() => ({
  handleAvatarCropped: vi.fn(),
  handleNext: vi.fn(),
  handleBack: vi.fn(),
  handleSkip: vi.fn(),
  updateProfileData: vi.fn(),
  setProfileData: vi.fn(),
}));

vi.mock('../useOnboarding', () => ({
  useOnboarding: () => ({
    currentStep: 1,
    isLoading: false,
    error: null,
    avatarPreview: null,
    profileData: {
      displayName: 'Tricky',
      bio: '',
      avatarUrl: null,
      notifyMessages: true,
      notifyMentions: true,
      notifyFriendRequests: true,
      theme: 'dark',
    },
    handleAvatarCropped: mocks.handleAvatarCropped,
    handleNext: mocks.handleNext,
    handleBack: mocks.handleBack,
    handleSkip: mocks.handleSkip,
    updateProfileData: mocks.updateProfileData,
    setProfileData: mocks.setProfileData,
    totalSteps: 4,
  }),
}));

describe('Onboarding', () => {
  it('renders the required wizard as a full-width app route', () => {
    const { container } = render(<Onboarding />);

    expect(screen.getByRole('heading', { name: 'Welcome to CGraph' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('w-full', 'flex-1', 'overflow-y-auto');
  });
});
