import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EntitlementBadge } from '../entitlement-badge';

describe('EntitlementBadge', () => {
  it('renders "Owned" for entitled items', () => {
    render(<EntitlementBadge entitled={true} isPremiumOnly={false} expired={false} />);

    expect(screen.getByText('Owned')).toBeInTheDocument();
  });

  it('renders "Premium" for premium-locked items', () => {
    render(<EntitlementBadge entitled={false} isPremiumOnly={true} expired={false} />);

    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('renders "Expired" for expired entitlements', () => {
    render(<EntitlementBadge entitled={false} isPremiumOnly={false} expired={true} />);

    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('renders "Locked" for non-entitled, non-premium items', () => {
    render(<EntitlementBadge entitled={false} isPremiumOnly={false} expired={false} />);

    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('expired takes priority over entitled', () => {
    render(<EntitlementBadge entitled={true} isPremiumOnly={false} expired={true} />);

    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.queryByText('Owned')).not.toBeInTheDocument();
  });

  it('expired takes priority over isPremiumOnly', () => {
    render(<EntitlementBadge entitled={false} isPremiumOnly={true} expired={true} />);

    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.queryByText('Premium')).not.toBeInTheDocument();
  });

  it('entitled takes priority over isPremiumOnly', () => {
    render(<EntitlementBadge entitled={true} isPremiumOnly={true} expired={false} />);

    expect(screen.getByText('Owned')).toBeInTheDocument();
    expect(screen.queryByText('Premium')).not.toBeInTheDocument();
  });

  it('renders with gray styling for expired badge', () => {
    const { container } = render(
      <EntitlementBadge entitled={false} isPremiumOnly={false} expired={true} />
    );

    const badge = container.querySelector('span')!;
    expect(badge.className).toContain('text-gray-400');
  });

  it('renders with amber styling for premium badge', () => {
    const { container } = render(
      <EntitlementBadge entitled={false} isPremiumOnly={true} expired={false} />
    );

    const badge = container.querySelector('span')!;
    expect(badge.className).toContain('text-amber-400');
  });

  it('renders SVG icons alongside text', () => {
    const { container } = render(
      <EntitlementBadge entitled={true} isPremiumOnly={false} expired={false} />
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(1);
  });

  it('renders lock icon for Locked state', () => {
    const { container } = render(
      <EntitlementBadge entitled={false} isPremiumOnly={false} expired={false} />
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(1);
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('renders clock icon for expired state', () => {
    const { container } = render(
      <EntitlementBadge entitled={false} isPremiumOnly={false} expired={true} />
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(1);
  });

  it('renders rounded-full pill shape for all states', () => {
    const { container } = render(
      <EntitlementBadge entitled={false} isPremiumOnly={false} expired={false} />
    );

    const span = container.querySelector('span');
    expect(span?.className).toContain('rounded-full');
  });
});
