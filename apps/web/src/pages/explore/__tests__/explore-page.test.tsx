import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ExplorePage from '../explore-page';

vi.mock('../tabs/discover-tab', () => ({
  DiscoverTab: () => <div>Discover content</div>,
}));
vi.mock('../tabs/feed-tab', () => ({
  FeedTab: () => <div>Feed content</div>,
}));
vi.mock('../tabs/people-tab', () => ({
  PeopleTab: () => <div>People content</div>,
}));
vi.mock('../tabs/groups-tab', () => ({
  GroupsTab: () => <div>Groups content</div>,
}));

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="Current route">{location.pathname}</output>;
}

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/explore"
          element={
            <>
              <ExplorePage />
              <LocationProbe />
            </>
          }
        />
        <Route
          path="/explore/:tab"
          element={
            <>
              <ExplorePage />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ExplorePage', () => {
  it('renders route links and identifies the current destination', () => {
    renderRoute('/explore/people');

    expect(screen.getByText('People content')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'People' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: 'Feed' })).toHaveAttribute('href', '/explore/feed');
    expect(screen.getByRole('link', { name: 'Groups' })).toHaveAttribute(
      'href',
      '/explore/groups'
    );
  });

  it('redirects an invalid tab instead of disguising it as Discover', async () => {
    renderRoute('/explore/unknown');

    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'Current route' })).toHaveTextContent('/explore')
    );
    expect(screen.getByText('Discover content')).toBeInTheDocument();
  });
});
