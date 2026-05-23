import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const {
  mockNavigate,
  mockToast,
  mockUpdateNotificationSettings,
  mockUpdateLocaleSettings,
  mockUseSettingsStore,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  mockUpdateNotificationSettings: vi.fn(),
  mockUpdateLocaleSettings: vi.fn(),
  mockUseSettingsStore: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children }: React.PropsWithChildren) => (
    <div data-testid="glass-card">{children}</div>
  ),
  toast: mockToast,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    light: vi.fn(),
    medium: vi.fn(),
  },
}));

vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: mockUseSettingsStore,
}));

import { DndSchedulePanel } from '../dnd-schedule-panel';

function mockStore(overrides?: {
  quietHoursEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone?: string;
  isSaving?: boolean;
}) {
  mockUseSettingsStore.mockReturnValue({
    settings: {
      notifications: {
        quietHoursEnabled: overrides?.quietHoursEnabled ?? true,
        quietHoursStart: overrides?.quietHoursStart ?? '21:30',
        quietHoursEnd: overrides?.quietHoursEnd ?? '07:15',
      },
      locale: {
        timezone: overrides?.timezone ?? 'Europe/Bucharest',
      },
    },
    updateNotificationSettings: mockUpdateNotificationSettings,
    updateLocaleSettings: mockUpdateLocaleSettings,
    isSaving: overrides?.isSaving ?? false,
  });
}

describe('DndSchedulePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateNotificationSettings.mockResolvedValue(undefined);
    mockUpdateLocaleSettings.mockResolvedValue(undefined);
    mockStore();
  });

  it('hydrates quiet hours from settings state', () => {
    const { container } = render(<DndSchedulePanel />);
    const timeInputs = container.querySelectorAll('input[type="time"]');

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(timeInputs[0]).toHaveValue('21:30');
    expect(timeInputs[1]).toHaveValue('07:15');
    expect(screen.getByRole('combobox')).toHaveValue('Europe/Bucharest');
  });

  it('saves recurring quiet hours and timezone changes', async () => {
    const { container } = render(<DndSchedulePanel />);
    const timeInputs = container.querySelectorAll('input[type="time"]');

    fireEvent.change(timeInputs[0]!, { target: { value: '22:00' } });
    fireEvent.change(timeInputs[1]!, { target: { value: '08:00' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'UTC' } });
    fireEvent.click(screen.getByText('Save Schedule'));

    await waitFor(() => {
      expect(mockUpdateNotificationSettings).toHaveBeenCalledWith({
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      });
    });
    expect(mockUpdateLocaleSettings).toHaveBeenCalledWith({ timezone: 'UTC' });
    expect(mockToast.success).toHaveBeenCalledWith('Schedule saved');
    expect(mockNavigate).toHaveBeenCalledWith('/me/settings/notifications');
  });

  it('clears quiet hour times when the schedule is disabled', async () => {
    render(<DndSchedulePanel />);

    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByText('Save Schedule'));

    await waitFor(() => {
      expect(mockUpdateNotificationSettings).toHaveBeenCalledWith({
        quietHoursEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
      });
    });
  });
});
