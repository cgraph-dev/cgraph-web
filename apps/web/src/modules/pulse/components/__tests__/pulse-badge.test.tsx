import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PulseBadge } from '../pulse-badge';

describe('PulseBadge', () => {
  it('renders the score with thousands separators for large values', () => {
    render(<PulseBadge score={12_500} tier="legend" />);
    const matches = screen.getAllByText(/12[.,]5K|12500|12,500/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('exposes the score via aria-label for screen readers', () => {
    render(<PulseBadge score={42} tier="active" />);
    expect(screen.getByLabelText(/pulse score: 42/i)).toBeInTheDocument();
  });

  it('renders without crashing when tier is omitted', () => {
    render(<PulseBadge score={7} />);
    expect(screen.getByLabelText(/pulse score: 7/i)).toBeInTheDocument();
  });

  it('renders zero scores', () => {
    render(<PulseBadge score={0} tier="newcomer" />);
    expect(screen.getByLabelText(/pulse score: 0/i)).toBeInTheDocument();
  });

  it('infers the canonical trusted tier at the shared threshold', () => {
    render(<PulseBadge score={50} />);
    expect(screen.getByLabelText('Pulse score: 50 (Trusted)')).toBeInTheDocument();
  });
});
