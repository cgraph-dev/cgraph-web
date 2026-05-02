/**
 * TopicCard Component Tests
 *
 * Tests for rendering topic icon/name, selected state styling,
 * and toggle callback.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopicCard } from '../topic-card';
const baseTopic = { id: 'topic-1', name: 'Gaming', icon: 'G', slug: 'gaming' };
describe('TopicCard', () => {
  it('renders topic icon and name', () => {
    render(<TopicCard topic={baseTopic} selected={false} onToggle={vi.fn()} />);

    expect(screen.getByText('G')).toBeTruthy();
    expect(screen.getByText('Gaming')).toBeTruthy();
  });

  it('calls onToggle with topic id when clicked', () => {
    const onToggle = vi.fn();
    render(<TopicCard topic={baseTopic} selected={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('topic-1');
  });

  it('applies selected styling when selected', () => {
    render(<TopicCard topic={baseTopic} selected={true} onToggle={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('border-indigo-500/60');
    expect(button.className).toContain('bg-indigo-500/10');
  });

  it('applies unselected styling when not selected', () => {
    render(<TopicCard topic={baseTopic} selected={false} onToggle={vi.fn()} />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-white/5');
    expect(button.className).not.toContain('border-indigo-500/60');
  });

  it('applies selected text color to name', () => {
    render(<TopicCard topic={baseTopic} selected={true} onToggle={vi.fn()} />);

    const nameEl = screen.getByText('Gaming');
    expect(nameEl.className).toContain('text-white');
    expect(nameEl.className).not.toContain('text-white/60');
  });

  it('applies unselected text color to name', () => {
    render(<TopicCard topic={baseTopic} selected={false} onToggle={vi.fn()} />);

    const nameEl = screen.getByText('Gaming');
    expect(nameEl.className).toContain('text-white/60');
  });

  it('accepts custom className', () => {
    render(
      <TopicCard topic={baseTopic} selected={false} onToggle={vi.fn()} className="custom-class" />
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });
});
