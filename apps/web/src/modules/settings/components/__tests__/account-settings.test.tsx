import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';

const mocks = vi.hoisted(() => ({
  httpPut: vi.fn(),
  updateUser: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  hapticMedium: vi.fn(),
  hapticSuccess: vi.fn(),
  user: {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
    bio: 'Existing bio',
    pronouns: 'they/them',
    canChangeUsername: true,
    usernameNextChangeAt: null as string | null,
  },
}));

const defaultUser = { ...mocks.user };

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({
    user: mocks.user,
    updateUser: mocks.updateUser,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    put: mocks.httpPut,
  },
}));

vi.mock('@/shared/components/ui', async () => {
  const [alert, button, card, input] = await Promise.all([
    vi.importActual<typeof import('@/components/ui/alert')>('@/components/ui/alert'),
    vi.importActual<typeof import('@/components/ui/button')>('@/components/ui/button'),
    vi.importActual<typeof import('@/components/ui/card')>('@/components/ui/card'),
    vi.importActual<typeof import('@/components/ui/input')>('@/components/ui/input'),
  ]);

  return {
    ...alert,
    ...button,
    Card: card.default,
    Input: input.Input,
    Textarea: input.Textarea,
    toast: {
      error: mocks.toastError,
      success: mocks.toastSuccess,
    },
  };
});

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    medium: mocks.hapticMedium,
    success: mocks.hapticSuccess,
  },
}));

vi.mock('../avatar-section', () => ({
  AvatarSection: () => <div data-testid="avatar-section">Avatar section</div>,
}));

import { AccountSettings } from '../account-settings';

describe('AccountSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mocks.user, defaultUser);
    mocks.httpPut.mockResolvedValue({
      data: {
        data: {
          display_name: 'Updated',
          bio: 'Updated bio',
          pronouns: 'they/them',
        },
      },
    });
  });

  it('mounts shared account fields with a non-editable account email', () => {
    render(<AccountSettings />);

    expect(screen.getByTestId('avatar-section')).toBeInTheDocument();
    expect(screen.getByLabelText('Public username')).toHaveAttribute(
      'data-cgraph-surface',
      'field'
    );
    expect(screen.getByLabelText('Display name')).toHaveValue('Test User');
    expect(screen.getByLabelText('About me')).toHaveValue('Existing bio');
    expect(screen.getByLabelText('Pronouns')).toHaveValue('they/them');
    expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveAttribute(
      'data-cgraph-surface',
      'control'
    );
  });

  it('normalizes a username and sends the exact username endpoint payload', async () => {
    mocks.httpPut.mockResolvedValueOnce({
      data: {
        data: {
          username: 'new_name',
          username_next_change_at: '2026-08-12T00:00:00Z',
        },
      },
    });
    render(<AccountSettings />);

    fireEvent.change(screen.getByLabelText('Public username'), {
      target: { value: 'New Name!@#' },
    });
    expect(screen.getByLabelText('Public username')).toHaveValue('newname');

    fireEvent.change(screen.getByLabelText('Public username'), {
      target: { value: 'New_Name' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Change username' }));

    await waitFor(() =>
      expect(mocks.httpPut).toHaveBeenCalledWith('/api/v1/me/username', {
        username: 'new_name',
      })
    );
    expect(mocks.updateUser).toHaveBeenCalledWith({
      username: 'new_name',
      canChangeUsername: false,
      usernameNextChangeAt: '2026-08-12T00:00:00Z',
    });
    expect(mocks.hapticMedium).toHaveBeenCalledOnce();
  });

  it('preserves the edited username and reports the server message when a change fails', async () => {
    const error = new AxiosError('request failed');
    error.response = {
      data: {
        error: { message: 'Username is already taken' },
      },
      status: 422,
    } as AxiosResponse;
    mocks.httpPut.mockRejectedValueOnce(error);
    render(<AccountSettings />);

    fireEvent.change(screen.getByLabelText('Public username'), {
      target: { value: 'Taken_Name' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Change username' }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith('Username is already taken')
    );
    expect(screen.getByLabelText('Public username')).toHaveValue('taken_name');
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('locks the username field during the server cooldown', () => {
    mocks.user.canChangeUsername = false;
    mocks.user.usernameNextChangeAt = '2026-08-12T00:00:00Z';

    render(<AccountSettings />);

    expect(screen.getByLabelText('Public username')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Change username' })).not.toBeInTheDocument();
    expect(screen.getByText(/Locked until/)).toBeInTheDocument();
  });

  it('trims profile fields and sends the existing backend user envelope', async () => {
    render(<AccountSettings />);

    fireEvent.change(screen.getByLabelText('Display name'), {
      target: { value: '  Updated  ' },
    });
    fireEvent.change(screen.getByLabelText('About me'), {
      target: { value: '  Updated bio  ' },
    });
    fireEvent.change(screen.getByLabelText('Pronouns'), {
      target: { value: 'she/they' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(mocks.httpPut).toHaveBeenCalledWith('/api/v1/me', {
        user: {
          display_name: 'Updated',
          bio: 'Updated bio',
          pronouns: 'she/they',
        },
      })
    );
    expect(mocks.hapticSuccess).toHaveBeenCalledOnce();
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Settings saved');
  });

  it('omits empty optional profile fields without submitting the displayed email', async () => {
    render(<AccountSettings />);

    fireEvent.change(screen.getByLabelText('Display name'), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByLabelText('About me'), {
      target: { value: ' Bio only ' },
    });
    fireEvent.change(screen.getByLabelText('Pronouns'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(mocks.httpPut).toHaveBeenCalledWith('/api/v1/me', {
        user: { bio: 'Bio only' },
      })
    );
  });

  it('shows an accessible error alert when a profile save fails', async () => {
    mocks.httpPut.mockRejectedValueOnce(new Error('offline'));
    render(<AccountSettings />);

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Profile was not saved');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to save settings');
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to save settings');
  });
});
