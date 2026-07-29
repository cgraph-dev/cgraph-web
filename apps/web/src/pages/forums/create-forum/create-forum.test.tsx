import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateForum from './create-forum';

const { useCreateForumMock } = vi.hoisted(() => ({
  useCreateForumMock: vi.fn(),
}));

vi.mock('./useCreateForum', () => ({
  useCreateForum: () => useCreateForumMock(),
}));

vi.mock('./step-indicator', () => ({
  StepIndicator: () => <div data-testid="step-indicator" />,
}));
vi.mock('./basic-info-step', () => ({
  BasicInfoStep: () => <div data-testid="basic-info-step" />,
}));
vi.mock('./appearance-step', () => ({
  AppearanceStep: () => <div data-testid="appearance-step" />,
}));
vi.mock('./settings-step', () => ({
  SettingsStep: () => <div data-testid="settings-step" />,
}));
vi.mock('./confirm-step', () => ({
  ConfirmStep: () => <div data-testid="confirm-step" />,
}));

function createHookState(overrides: Record<string, unknown> = {}) {
  return {
    step: 1,
    formData: {},
    isSubmitting: false,
    error: null,
    isAuthenticated: true,
    user: { subscription: { tier: 'free' } },
    handleNameChange: vi.fn(),
    updateFormData: vi.fn(),
    handleSubmit: vi.fn(),
    goToNextStep: vi.fn(),
    goToPrevStep: vi.fn(),
    isStep1Valid: vi.fn(() => true),
    navigate: vi.fn(),
    ...overrides,
  };
}

describe('CreateForum', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCreateForumMock.mockReturnValue(createHookState());
  });

  it('routes unauthenticated users to login through the visible action', () => {
    const navigate = vi.fn();
    useCreateForumMock.mockReturnValue(
      createHookState({ isAuthenticated: false, navigate }),
    );

    render(<CreateForum />);
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('keeps next disabled while the first step is invalid', () => {
    const goToNextStep = vi.fn();
    useCreateForumMock.mockReturnValue(
      createHookState({
        goToNextStep,
        isStep1Valid: vi.fn(() => false),
      }),
    );

    render(<CreateForum />);
    const next = screen.getByRole('button', { name: 'Next' });

    expect(next).toBeDisabled();
    fireEvent.click(next);
    expect(goToNextStep).not.toHaveBeenCalled();
  });

  it('locks the final action and exposes progress while creating', () => {
    const handleSubmit = vi.fn();
    useCreateForumMock.mockReturnValue(
      createHookState({ step: 4, isSubmitting: true, handleSubmit }),
    );

    render(<CreateForum />);
    const create = screen.getByRole('button', { name: 'Creating…' });

    expect(create).toBeDisabled();
    expect(create).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(create);
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
