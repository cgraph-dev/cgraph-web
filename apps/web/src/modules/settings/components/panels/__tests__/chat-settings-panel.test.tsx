import type { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ChatSettingsPanel } from '../chat-settings-panel';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children }: PropsWithChildren) => <section>{children}</section>,
}));

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderPanel() {
  return render(
    <MemoryRouter initialEntries={['/me/settings/chats']}>
      <Routes>
        <Route path="/me/settings/chats" element={<ChatSettingsPanel />} />
        <Route path="/me/appearance/bubbles" element={<LocationProbe />} />
        <Route path="/spaces" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ChatSettingsPanel', () => {
  it('routes chat appearance to the persisted chat-theme owner', async () => {
    renderPanel();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Open appearance' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/me/appearance/bubbles');
  });

  it('routes Spaces to the server-owned folder manager', async () => {
    renderPanel();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Manage Spaces' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/spaces');
  });
});
