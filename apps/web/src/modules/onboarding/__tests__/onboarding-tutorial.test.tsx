import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingTutorial } from '../onboarding-tutorial';

const mocks = vi.hoisted(() => ({
  fetchStatus: vi.fn(),
  skipTutorial: vi.fn(),
  toggleExpanded: vi.fn(),
}));

vi.mock('../onboarding-store', () => ({
  useOnboardingStore: () => ({
    isVisible: true,
    isCompleted: false,
    isExpanded: true,
    steps: {
      send_first_message: false,
      join_or_create_hub: false,
      customize_profile: false,
      enable_e2ee_backup: false,
    },
    isLoading: false,
    fetchStatus: mocks.fetchStatus,
    skipTutorial: mocks.skipTutorial,
    toggleExpanded: mocks.toggleExpanded,
  }),
}));

describe('OnboardingTutorial', () => {
  it('does not compete with the required onboarding route', () => {
    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <OnboardingTutorial />
      </MemoryRouter>
    );

    expect(screen.queryByRole('complementary', { name: /getting started tutorial/i })).toBeNull();
    expect(mocks.fetchStatus).not.toHaveBeenCalled();
  });

  it('renders on normal app routes', () => {
    render(
      <MemoryRouter initialEntries={['/messages']}>
        <OnboardingTutorial />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('complementary', { name: /getting started tutorial/i })
    ).toBeInTheDocument();
    expect(mocks.fetchStatus).toHaveBeenCalled();
  });
});
