import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

function TestButton({
  children,
  animated: _animated,
  isLoading,
  leftIcon,
  ...props
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    animated?: boolean;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
  }
>) {
  return (
    <button {...props} disabled={props.disabled || isLoading}>
      {leftIcon}
      {children}
    </button>
  );
}

vi.mock('@/shared/components/ui', () => ({
  Button: TestButton,
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: PropsWithChildren<{ open: boolean; onOpenChange: (open: boolean) => void }>) =>
    open ? (
      <>
        <button type="button" aria-label="Dismiss dialog" onClick={() => onOpenChange(false)} />
        {children}
      </>
    ) : null,
  DialogContent: ({
    children,
    ariaLabelledBy,
    ariaDescribedBy,
  }: PropsWithChildren<
    HTMLAttributes<HTMLDivElement> & {
      ariaLabelledBy?: string;
      ariaDescribedBy?: string;
    }
  >) => (
    <div
      role="dialog"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </div>
  ),
  DialogDescription: ({ children }: PropsWithChildren) => <p>{children}</p>,
  DialogFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
  DialogHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
  DialogTitle: ({ children }: PropsWithChildren) => <h2>{children}</h2>,
}));

import { NotificationProfileDeleteDialog } from '../notification-profile-delete-dialog';

describe('NotificationProfileDeleteDialog', () => {
  it('labels the destructive consequence and focuses the safe action', () => {
    render(
      <NotificationProfileDeleteDialog
        profileName="Focus"
        open
        isDeleting={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      screen.getByRole('dialog', { name: 'Delete notification profile?' })
    ).toHaveAccessibleDescription(
      'Delete “Focus”? Its schedule and notification exceptions will be removed. This cannot be undone.'
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('locks cancellation and confirmation while deletion is in flight', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();
    render(
      <NotificationProfileDeleteDialog
        profileName="Focus"
        open
        isDeleting
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete profile' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Dismiss dialog' }));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
