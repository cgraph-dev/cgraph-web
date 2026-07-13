import type { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MePage from './me-page';

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      animate: _animate,
      children,
      initial: _initial,
      layoutId: _layoutId,
      transition: _transition,
      whileTap: _whileTap,
      ...props
    }: PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn() },
}));

function LocationProbe() {
  return <div data-testid="location">{useLocation().pathname}</div>;
}

function renderMeRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/me" element={<MePage />}>
          <Route path="settings" element={<div>Settings route</div>} />
          <Route path="appearance/:category" element={<div>Appearance route</div>} />
        </Route>
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );
}

describe('MePage', () => {
  it('redirects the bare legacy entry to the settings root', () => {
    renderMeRoute('/me');

    expect(screen.getByTestId('location')).toHaveTextContent('/me/settings');
    expect(screen.getByText('Settings route')).toBeInTheDocument();
  });

  it('keeps direct appearance routes separate from settings', () => {
    renderMeRoute('/me/appearance/identity');

    expect(screen.getByTestId('location')).toHaveTextContent('/me/appearance/identity');
    expect(screen.getByText('Appearance route')).toBeInTheDocument();
  });
});
