import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VersionUpdateGate } from '../version-update-gate';

describe('VersionUpdateGate', () => {
  it('blocks the app until the user reloads', () => {
    const onReload = vi.fn();

    render(<VersionUpdateGate onReload={onReload} />);

    expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'Update required' })).toBeInTheDocument();

    const reload = screen.getByRole('button', { name: 'Reload' });
    expect(screen.getAllByRole('button')).toHaveLength(1);

    fireEvent.click(reload);

    expect(onReload).toHaveBeenCalledOnce();
  });
});
