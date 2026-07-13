import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSettingsStore } = vi.hoisted(() => {
  const updateAppearanceSettings = vi.fn(() => Promise.resolve());

  return {
    mockSettingsStore: {
      settings: { appearance: { reduceMotion: false, highContrast: false } },
      updateAppearanceSettings,
    },
  };
});

vi.mock('@/components/theme-picker', () => ({
  ThemePicker: () => <div>Theme picker</div>,
}));

vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: (selector: (state: typeof mockSettingsStore) => unknown) =>
    selector(mockSettingsStore),
}));

vi.mock('@/modules/settings/components/appearance-settings/accessibility', () => ({
  Accessibility: ({
    reduceMotion,
    highContrast,
    toggleReduceMotion,
    toggleHighContrast,
  }: {
    reduceMotion: boolean;
    highContrast: boolean;
    toggleReduceMotion: () => void;
    toggleHighContrast: () => void;
  }) => (
    <div>
      <button type="button" aria-pressed={reduceMotion} onClick={toggleReduceMotion}>
        Reduce Motion
      </button>
      <button type="button" aria-pressed={highContrast} onClick={toggleHighContrast}>
        High Contrast
      </button>
    </div>
  ),
}));

import AppThemeSettings from '../app-theme-settings';

describe('AppThemeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mounts durable accessibility controls alongside the theme picker', () => {
    render(<AppThemeSettings />);

    fireEvent.click(screen.getByRole('button', { name: 'Reduce Motion' }));
    fireEvent.click(screen.getByRole('button', { name: 'High Contrast' }));

    expect(screen.getByText('Theme picker')).toBeInTheDocument();
    expect(mockSettingsStore.updateAppearanceSettings).toHaveBeenCalledWith({ reduceMotion: true });
    expect(mockSettingsStore.updateAppearanceSettings).toHaveBeenCalledWith({ highContrast: true });
  });
});
