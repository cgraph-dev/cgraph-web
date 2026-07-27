import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveBar } from '../save-bar';

describe('SaveBar', () => {
  it('renders nothing when no changes', () => {
    const { container } = render(
      <SaveBar hasChanges={false} isSaving={false} onSave={vi.fn()} onReset={vi.fn()} />
    );
    expect(container.textContent).toBe('');
  });

  it('shows unsaved changes message', () => {
    render(<SaveBar hasChanges={true} isSaving={false} onSave={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText('You have unsaved changes')).toBeTruthy();
  });

  it('shows Save Changes button', () => {
    render(<SaveBar hasChanges={true} isSaving={false} onSave={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveAttribute(
      'data-cgraph-surface',
      'control'
    );
  });

  it('preserves the save label and exposes pending state while saving', () => {
    render(<SaveBar hasChanges={true} isSaving={true} onSave={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });

  it('calls onSave when Save clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<SaveBar hasChanges={true} isSaving={false} onSave={onSave} onReset={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSave).toHaveBeenCalled();
  });

  it('calls onReset when Reset clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<SaveBar hasChanges={true} isSaving={false} onSave={vi.fn()} onReset={onReset} />);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('disables both actions while saving', () => {
    render(<SaveBar hasChanges={true} isSaving={true} onSave={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
  });

  it('keeps reset available but disables an invalid save', () => {
    render(
      <SaveBar
        hasChanges={true}
        isSaving={false}
        canSave={false}
        onSave={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeEnabled();
  });

  it('renders the route-owned error as an alert', () => {
    render(
      <SaveBar
        hasChanges={true}
        isSaving={false}
        errorMessage="Could not save group settings."
        onSave={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Could not save group settings.');
  });
});
