import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { Switch } from '../switch';

describe('Switch', () => {
  it('renders the shared native switch contract', () => {
    render(<Switch checked ariaLabel="Enable notifications" />);

    const control = screen.getByRole('switch', { name: 'Enable notifications' });

    expect(control.tagName).toBe('BUTTON');
    expect(control).toHaveAttribute('aria-checked', 'true');
    expect(control).toHaveAttribute('data-cgraph-material', 'control');
    expect(control).toHaveAttribute('data-cgraph-variant', 'secondary');
    expect(control.querySelector('span')).toHaveClass('aurora-social-toggle-thumb');
  });

  it('reports the next state once when activated', () => {
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} ariaLabel="Enable calls" />);

    fireEvent.click(screen.getByRole('switch', { name: 'Enable calls' }));

    expect(onCheckedChange).toHaveBeenCalledOnce();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('does not activate while disabled', () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch checked={false} disabled onCheckedChange={onCheckedChange} ariaLabel="Enable calls" />
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Enable calls' }));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
