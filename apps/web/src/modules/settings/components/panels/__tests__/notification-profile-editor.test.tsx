import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { NotificationProfileEditor } from '../notification-profile-editor';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    light: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
  },
}));

vi.mock('@/modules/settings/store/notification-profile-store', () => ({
  useNotificationProfileStore: () => ({
    profiles: [],
    fetchProfiles: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    updateSchedule: vi.fn(),
    deleteProfile: vi.fn(),
  }),
}));

describe('NotificationProfileEditor', () => {
  it('uses the nested settings route detail param for the create screen', () => {
    render(
      <MemoryRouter initialEntries={['/me/settings/notification-profiles/new']}>
        <Routes>
          <Route
            path="/me/settings/:section/:detail"
            element={<NotificationProfileEditor />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Create Profile' })).toBeInTheDocument();
  });
});
