import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Onboarding from '../onboarding';

const mocks = vi.hoisted(() => ({
  isLoading: false,
  error: null as string | null,
  setDisplayName: vi.fn(),
  handleAvatarCropped: vi.fn(),
  submit: vi.fn(),
}));

vi.mock('../useOnboarding', () => ({
  useOnboarding: () => ({
    user: { avatarUrl: null },
    displayName: 'Tricky',
    isLoading: mocks.isLoading,
    error: mocks.error,
    setDisplayName: mocks.setDisplayName,
    handleAvatarCropped: mocks.handleAvatarCropped,
    submit: mocks.submit,
  }),
}));
vi.mock('@/components/avatar/avatar-upload-cropper', () => ({
  AvatarUploadCropper: () => <button type="button">Choose avatar image</button>,
}));

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLoading = false;
    mocks.error = null;
  });

  it('renders one accessible required profile form', () => {
    render(<Onboarding />);

    expect(screen.getByRole('heading', { name: 'Choose how people see you' })).toBeInTheDocument();
    expect(screen.getByLabelText('Display name')).toHaveAttribute('maxLength', '100');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    expect(screen.queryByText('Find Friends')).not.toBeInTheDocument();
  });

  it('submits the form through the single hook command', () => {
    render(<Onboarding />);

    fireEvent.submit(screen.getByRole('button', { name: 'Continue' }).closest('form')!);
    expect(mocks.submit).toHaveBeenCalledTimes(1);
  });

  it('shows loading and retryable failure states without moving the layout', () => {
    mocks.isLoading = true;
    mocks.error = 'We could not save your profile.';

    render(<Onboarding />);

    expect(screen.getByRole('button', { name: 'Saving profile' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('We could not save your profile.');
  });
});
