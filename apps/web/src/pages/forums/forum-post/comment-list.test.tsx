import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Comment } from '@/modules/forums/store';
import { CommentList } from './comment-list';

vi.mock('./comment-item', () => ({
  CommentItem: ({
    comment,
    onVote,
  }: {
    readonly comment: Comment;
    readonly onVote: (id: string, value: 1 | -1, currentVote: 1 | -1 | null) => void;
  }) => (
    <button type="button" onClick={() => onVote(comment.id, 1, null)}>
      {comment.id}
    </button>
  ),
}));

const handlers = {
  onVote: vi.fn(),
  setReplyingTo: vi.fn(),
  setReplyContent: vi.fn(),
  onSubmitReply: vi.fn(),
};

const baseProps = {
  comments: [] as Comment[],
  isLoading: false,
  replyingTo: null,
  replyContent: '',
  isSubmitting: false,
  ...handlers,
};

describe('CommentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes an accessible loading status', () => {
    render(<CommentList {...baseProps} isLoading />);

    expect(screen.getByRole('status', { name: 'Loading comments' })).toBeInTheDocument();
  });

  it('renders the empty state only after loading completes', () => {
    render(<CommentList {...baseProps} />);

    expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument();
  });

  it('passes vote behavior directly to each comment item', () => {
    const comment = { id: 'comment-1' } as Comment;
    render(<CommentList {...baseProps} comments={[comment]} />);

    fireEvent.click(screen.getByRole('button', { name: 'comment-1' }));
    expect(handlers.onVote).toHaveBeenCalledWith('comment-1', 1, null);
  });
});
