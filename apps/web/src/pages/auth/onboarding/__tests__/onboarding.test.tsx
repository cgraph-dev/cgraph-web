import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Onboarding from '../onboarding';

const mocks = vi.hoisted(() => ({
  currentStep: 1,
  handleAvatarCropped: vi.fn(),
  handleNext: vi.fn(),
  handleBack: vi.fn(),
  handleSkip: vi.fn(),
  updateProfileData: vi.fn(),
  setProfileData: vi.fn(),
}));

vi.mock('../useOnboarding', () => ({
  useOnboarding: () => ({
    currentStep: mocks.currentStep,
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

vi.mock('../find-friends-step', () => ({
  FindFriendsStep: () => <div>Search people already on CGraph</div>,
}));

describe('Onboarding', () => {
  beforeEach(() => {
    mocks.currentStep = 1;
  });

  it('renders the required wizard as a full-width app route', () => {
    const { container } = render(<Onboarding />);

    expect(screen.getByRole('heading', { name: 'Welcome to CGraph' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('w-full', 'flex-1', 'overflow-y-auto');
  });

  it('mounts real friend discovery as the second onboarding step', () => {
    mocks.currentStep = 2;

    render(<Onboarding />);

    expect(screen.getByRole('heading', { name: 'Find Friends' })).toBeInTheDocument();
    expect(screen.getByText('Search people already on CGraph')).toBeInTheDocument();
    expect(screen.queryByText('Discover Communities')).not.toBeInTheDocument();
  });
});
