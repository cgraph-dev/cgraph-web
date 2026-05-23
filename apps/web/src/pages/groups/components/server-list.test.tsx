import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ServerList } from './server-list';

vi.mock('motion/react', () => ({
  motion: {
    button: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
    div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    medium: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/modules/groups/store', () => ({
  useGroupStore: () => ({
    joinGroup: vi.fn(),
  }),
}));

vi.mock('@/modules/groups/components/group-list/create-group-modal', () => ({
  CreateGroupModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="create-group-modal">Create group modal</div> : null,
}));

describe('ServerList', () => {
  it('opens the real create modal from the routed create query', () => {
    render(
      <MemoryRouter initialEntries={['/groups?create=true']}>
        <Routes>
          <Route path="/groups" element={<ServerList groups={[]} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('create-group-modal')).toBeInTheDocument();
  });
});
