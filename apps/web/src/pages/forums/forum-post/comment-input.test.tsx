import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CommentInput } from './comment-input';

function renderCommentInput(overrides: Partial<React.ComponentProps<typeof CommentInput>> = {}) {
  const props: React.ComponentProps<typeof CommentInput> = {
    isLocked: false,
    username: 'trick',
    value: 'A useful comment',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
    ...overrides,
  };

  render(<CommentInput {...props} />);
  return props;
}

describe('CommentInput', () => {
  it('replaces the composer with a locked-post notice', () => {
    renderCommentInput({ isLocked: true });

    expect(screen.getByText('This post is locked. New comments are disabled.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Comment' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Comment' })).not.toBeInTheDocument();
  });

  it('keeps empty comments disabled', () => {
    const { onSubmit } = renderCommentInput({ value: '   ' });
    const submit = screen.getByRole('button', { name: 'Comment' });

    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reports text changes through the owned callback', () => {
    const { onChange } = renderCommentInput({ value: '' });

    fireEvent.change(screen.getByRole('textbox', { name: 'Comment' }), {
      target: { value: 'New comment' },
    });

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('New comment');
  });

  it('submits an eligible comment exactly once', () => {
    const { onSubmit } = renderCommentInput();

    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('locks the action and exposes progress while posting', () => {
    const { onSubmit } = renderCommentInput({ isSubmitting: true });
    const submit = screen.getByRole('button', { name: 'Posting…' });

    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
