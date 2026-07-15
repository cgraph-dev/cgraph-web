import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children }: { readonly children: ReactNode }) => <div>{children}</div>,
  },
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    auth: {
      phoneCountries: vi.fn(),
    },
  },
  http: {
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/modules/auth/store/authStore.impl', () => ({
  useAuthStore: {
    setState: vi.fn(),
  },
}));

vi.mock('@/modules/auth/store/authStore.utils', () => ({
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
  mapUserFromApi: (user: unknown) => user,
}));

vi.mock('@/modules/auth/components/country-picker', () => ({
  CountryPicker: () => null,
}));
vi.mock('@/modules/auth/components/otp-entry', () => ({
  OtpEntry: () => <div data-testid="otp-entry" />,
}));
vi.mock('@/modules/auth/components/permission-requests', () => ({
  PermissionRequests: () => <div data-testid="permission-entry" />,
}));
vi.mock('@/modules/auth/components/pin-entry', () => ({
  PinEntry: () => <div data-testid="pin-entry" />,
}));
vi.mock('@/modules/auth/components/phone-entry', () => ({
  PhoneEntry: () => <div data-testid="phone-entry" />,
}));
vi.mock('@/modules/auth/components/profile-setup', () => ({
  ProfileSetup: () => <div data-testid="profile-entry" />,
}));

import { usePhoneRegistrationStore } from '@/modules/auth/store/registration-store';
import PhoneRegister from './phone-register';

const unitedStates = {
  code: 'US',
  name: 'United States',
  calling_code: '+1',
  flag: 'US',
};

describe('PhoneRegister', () => {
  beforeEach(async () => {
    usePhoneRegistrationStore.getState().reset();
    await usePhoneRegistrationStore.persist.clearStorage();
    sessionStorage.clear();
  });

  it('keeps a valid OTP checkpoint across a same-route remount', () => {
    usePhoneRegistrationStore.setState({
      intent: 'register',
      step: 'otp',
      countries: [unitedStates],
      selectedCountry: unitedStates,
      phoneNumber: '(415) 555-0001',
      submittedPhoneNumber: '+14155550001',
      codeExpiresAt: Date.now() + 600_000,
      sessionId: 'session-1',
    });

    const firstRender = render(
      <MemoryRouter initialEntries={['/register/phone']}>
        <PhoneRegister />
      </MemoryRouter>
    );

    expect(screen.getByTestId('otp-entry')).toBeInTheDocument();
    expect(screen.queryByTestId('phone-entry')).not.toBeInTheDocument();

    firstRender.unmount();

    render(
      <MemoryRouter initialEntries={['/register/phone']}>
        <PhoneRegister />
      </MemoryRouter>
    );

    expect(screen.getByTestId('otp-entry')).toBeInTheDocument();
    expect(usePhoneRegistrationStore.getState().sessionId).toBe('session-1');
  });
});
