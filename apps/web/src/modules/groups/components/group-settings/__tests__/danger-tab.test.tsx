import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DangerTab } from '../danger-tab';

describe('DangerTab', () => {
  it('uses shared destructive controls and delegates confirmation to the parent', async () => {
    const user = userEvent.setup();
    const onLeave = vi.fn();
    const onDelete = vi.fn();

    render(<DangerTab isOwner onLeave={onLeave} onDelete={onDelete} />);

    const leave = screen.getByRole('button', { name: 'Leave' });
    const deleteGroup = screen.getByRole('button', { name: 'Delete' });

    expect(leave).toHaveAttribute('data-cgraph-variant', 'danger');
    expect(deleteGroup).toHaveAttribute('data-cgraph-variant', 'danger');
    expect(document.querySelectorAll('[data-cgraph-surface="card"]')).toHaveLength(2);

    await user.click(leave);
    await user.click(deleteGroup);

    expect(onLeave).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('hides group deletion from non-owners while retaining leave', () => {
    render(<DangerTab isOwner={false} onLeave={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-cgraph-surface="card"]')).toHaveLength(1);
  });

  it('announces parent-owned mutation failures', () => {
    render(
      <DangerTab
        isOwner
        errorMessage="You do not have permission to leave this group."
        onLeave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You do not have permission to leave this group.'
    );
  });
});
