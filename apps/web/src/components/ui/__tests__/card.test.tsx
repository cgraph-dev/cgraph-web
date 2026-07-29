import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../card';

describe('Card', () => {
  it('renders the canonical solid card surface', () => {
    const { container } = render(<Card>Card content</Card>);
    const card = container.firstElementChild;

    expect(screen.getByText('Card content')).toBeInTheDocument();
    expect(card).toHaveClass('cgraph-card', 'p-4');
    expect(card).toHaveAttribute('data-cgraph-material', 'solid');
    expect(card).toHaveAttribute('data-cgraph-surface', 'card');
  });

  it.each([
    ['none', null],
    ['sm', 'p-3'],
    ['md', 'p-4'],
    ['lg', 'p-6'],
  ] as const)('maps %s padding to the canonical class', (padding, expectedClass) => {
    const { container } = render(<Card padding={padding}>Content</Card>);
    const card = container.firstElementChild;

    if (expectedClass) {
      expect(card).toHaveClass(expectedClass);
    } else {
      expect(card).not.toHaveClass('p-3', 'p-4', 'p-6');
    }
  });

  it('preserves caller layout classes', () => {
    const { container } = render(<Card className="overflow-hidden">Content</Card>);
    expect(container.firstElementChild).toHaveClass('overflow-hidden');
  });
});

describe('Card composition', () => {
  it('renders the canonical section hierarchy', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
        <CardContent>Content</CardContent>
      </Card>
    );

    expect(screen.getByText('Header')).toHaveClass('border-b');
    expect(screen.getByRole('heading', { name: 'Title', level: 3 })).toHaveClass(
      'text-[var(--token-text-primary)]'
    );
    expect(screen.getByText('Description')).toHaveClass('text-[var(--token-text-muted)]');
    expect(screen.getByText('Content')).toHaveClass('text-[var(--token-text-secondary)]');
  });

  it('supports an explicit heading level', () => {
    render(<CardTitle as="h2">Section title</CardTitle>);
    expect(screen.getByRole('heading', { name: 'Section title', level: 2 })).toBeInTheDocument();
  });

  it('preserves section layout classes', () => {
    render(
      <CardHeader className="flex">
        <CardTitle className="truncate">Title</CardTitle>
      </CardHeader>
    );

    expect(screen.getByText('Title').parentElement).toHaveClass('flex');
    expect(screen.getByText('Title')).toHaveClass('truncate');
  });
});
