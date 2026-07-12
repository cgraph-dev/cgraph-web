import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockHttp, mockSetTheme, mockToggleSystemPreference } = vi.hoisted(() => ({
  mockHttp: { put: vi.fn() },
  mockSetTheme: vi.fn(),
  mockToggleSystemPreference: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({ http: mockHttp }));

vi.mock('@/providers/theme-enhanced/hooks', () => ({
  useThemeEnhanced: () => ({
    theme: { id: 'aurora' },
    preferences: { settings: { reduceMotion: true, respectSystemPreference: false } },
    setTheme: mockSetTheme,
    toggleSystemPreference: mockToggleSystemPreference,
  }),
}));

vi.mock('@/lib/theme/tokens', () => ({
  getTokensForTheme: vi.fn(() => ({})),
}));

vi.mock('../theme-preview-card', () => ({
  ThemePreviewCard: ({ themeId, onSelect }: { themeId: string; onSelect: (id: string) => void }) => (
    <button type="button" onClick={() => onSelect(themeId)}>
      {themeId}
    </button>
  ),
}));

vi.mock('../theme-transition', () => ({
  transitionTheme: (applyTheme: () => void) => applyTheme(),
}));

import { ThemePicker } from '../theme-picker';

describe('ThemePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates an explicit selection to the Settings-owning provider without a legacy API write', () => {
    render(<ThemePicker />);

    fireEvent.click(screen.getByRole('button', { name: 'dark' }));

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    expect(mockHttp.put).not.toHaveBeenCalled();
  });
});
