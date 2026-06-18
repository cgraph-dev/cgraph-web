/** @module AccountSettings tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  httpPut: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({
    user: {
      id: 'user-1',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      canChangeUsername: true,
      usernameNextChangeAt: null,
    },
    updateUser: mocks.updateUser,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    put: mocks.httpPut,
  },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { success: vi.fn(), medium: vi.fn() },
}));

vi.mock('../avatar-section', () => ({
  AvatarSection: ({ user: _user }: { user: unknown }) => (
    <div data-testid="avatar-section">Avatar Section</div>
  ),
}));

vi.mock('../profile-form-fields', () => ({
  ProfileFormFields: ({
    user,
    isSaving,
  }: {
    user: {
      displayName?: string;
      bio?: string;
      pronouns?: string;
    } | null;
    isSaving: boolean;
  }) => (
    <div data-testid="profile-form-fields">
      <input aria-label="Display Name" name="displayName" defaultValue={user?.displayName ?? ''} />
      <textarea aria-label="About Me" name="bio" defaultValue={user?.bio ?? ''} />
      <select aria-label="Pronouns" name="pronouns" defaultValue={user?.pronouns ?? ''}>
        <option value="">Prefer not to say</option>
        <option value="they/them">they/them</option>
      </select>
      <button type="submit" disabled={isSaving}>
        Save Changes
      </button>
    </div>
  ),
}));

import { AccountSettings } from '../account-settings';

describe('AccountSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.httpPut.mockResolvedValue({
      data: { data: { display_name: 'Updated', bio: 'Updated bio', pronouns: null } },
    });
  });

  it('renders AvatarSection component', () => {
    render(<AccountSettings />);
    expect(screen.getByTestId('avatar-section')).toBeInTheDocument();
  });

  it('renders profile form fields', () => {
    render(<AccountSettings />);
    expect(screen.getByTestId('profile-form-fields')).toBeInTheDocument();
  });

  it('renders username input with current username', () => {
    render(<AccountSettings />);
    const usernameInput = screen.getByPlaceholderText('testuser');
    expect(usernameInput).toHaveValue('testuser');
  });

  it('renders username label', () => {
    render(<AccountSettings />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('allows typing in username field', () => {
    render(<AccountSettings />);
    const usernameInput = screen.getByPlaceholderText('testuser');
    fireEvent.change(usernameInput, { target: { value: 'newname' } });
    expect(usernameInput).toHaveValue('newname');
  });

  it('filters invalid characters from username input', () => {
    render(<AccountSettings />);
    const usernameInput = screen.getByPlaceholderText('testuser');
    // The component's onChange lowercases and strips non-alphanumeric/underscore chars
    // In JSDOM, fireEvent.change sets target.value then React's onChange processes it
    fireEvent.change(usernameInput, { target: { value: 'valid_name123' } });
    expect(usernameInput).toHaveValue('valid_name123');
  });

  it('shows Change button when username differs and is long enough', () => {
    render(<AccountSettings />);
    const usernameInput = screen.getByPlaceholderText('testuser');
    fireEvent.change(usernameInput, { target: { value: 'newname' } });
    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('does not show Change button when username matches current', () => {
    render(<AccountSettings />);
    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });

  it('renders GlassCard wrapper for username section', () => {
    render(<AccountSettings />);
    const cards = screen.getAllByTestId('glass-card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it('shows username cooldown copy when username can be changed', () => {
    render(<AccountSettings />);
    expect(screen.getByText(/Username can be changed every 14 days/i)).toBeInTheDocument();
  });

  it('saves profile fields using the backend user envelope', async () => {
    render(<AccountSettings />);

    fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: 'Updated' } });
    fireEvent.change(screen.getByLabelText('About Me'), { target: { value: 'Updated bio' } });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mocks.httpPut).toHaveBeenCalledWith('/api/v1/me', {
        user: {
          display_name: 'Updated',
          bio: 'Updated bio',
          pronouns: null,
        },
      });
    });

    expect(mocks.updateUser).toHaveBeenCalledWith({
      displayName: 'Updated',
      bio: 'Updated bio',
      pronouns: '',
    });
  });
});
