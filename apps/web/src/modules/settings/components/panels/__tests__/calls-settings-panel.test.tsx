/** @module calls-settings-panel tests */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const updateCallsSettings = vi.fn().mockResolvedValue(undefined);

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className as string}>{children}</div>
    ),
  },
}));

vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: (selector: (state: object) => unknown) =>
    selector({
      settings: {
        calls: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          defaultVideoResolution: 'auto',
        },
      },
      updateCallsSettings,
    }),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children }: React.PropsWithChildren) => <section>{children}</section>,
}));

import { CallsSettingsPanel } from '../calls-settings-panel';

describe('CallsSettingsPanel', () => {
  it('sends microphone changes to the typed Calls settings owner', async () => {
    render(<CallsSettingsPanel />);

    fireEvent.click(screen.getByLabelText('Echo cancellation'));

    await waitFor(() => {
      expect(updateCallsSettings).toHaveBeenCalledWith({ echoCancellation: false });
    });
  });

  it('sends the selected resolution to the typed Calls settings owner', async () => {
    render(<CallsSettingsPanel />);

    fireEvent.click(screen.getByRole('button', { name: /1080p.*Full HD/i }));

    await waitFor(() => {
      expect(updateCallsSettings).toHaveBeenCalledWith({ defaultVideoResolution: '1080p' });
    });
  });
});
