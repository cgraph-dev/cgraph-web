import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileOnlyFeature } from '../mobile-only-feature';

describe('MobileOnlyFeature', () => {
  it('renders the feature title', () => {
    render(<MobileOnlyFeature feature="Direct Messages" />);
    expect(
      screen.getByRole('heading', { name: /Direct Messages is mobile \+ desktop only/i })
    ).toBeInTheDocument();
  });

  it('explains encryption is mobile + desktop only', () => {
    render(<MobileOnlyFeature feature="Direct Messages" />);
    expect(screen.getByText(/end-to-end encrypted/i)).toBeInTheDocument();
    expect(screen.getByText(/mobile or desktop/i)).toBeInTheDocument();
  });

  it('links to the downloads page', () => {
    render(<MobileOnlyFeature feature="Ghost Chat" />);
    const link = screen.getByRole('link', { name: /get the app/i });
    expect(link).toHaveAttribute('href', 'https://cgraph.org/download');
  });
});
