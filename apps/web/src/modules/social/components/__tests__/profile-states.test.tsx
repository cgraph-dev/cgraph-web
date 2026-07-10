import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { ProfileErrorState, ProfileLoadingState } from '../profile-states';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const {
        animate: _animate,
        transition: _transition,
        whileHover: _whileHover,
        whileTap: _whileTap,
        ...domProps
      } = rest;
      return <div {...domProps}>{children}</div>;
    },
  },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  default: ({
    children,
    onClick,
  }: React.PropsWithChildren<{ onClick?: React.MouseEventHandler<HTMLButtonElement> }>) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { medium: vi.fn() },
}));

describe('profile states', () => {
  it('renders the loading spinner without random ambient particles', () => {
    const { container } = render(<ProfileLoadingState />);

    expect(container.querySelector('.border-t-transparent')).toBeInTheDocument();
    expect(container.querySelector('[style*="left"]')).not.toBeInTheDocument();
    expect(container.querySelector('[style*="top"]')).not.toBeInTheDocument();
  });

  it('renders the error card without random ambient particles', () => {
    const { container } = render(<ProfileErrorState error="Failed to load user profile" />);

    expect(screen.getByText('Failed to load user profile')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
    expect(container.querySelector('[style*="left"]')).not.toBeInTheDocument();
    expect(container.querySelector('[style*="top"]')).not.toBeInTheDocument();
  });
});
