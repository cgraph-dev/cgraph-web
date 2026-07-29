import { InlineLoadingSpinner } from '@/components/feedback/loading-spinner';
import type { Comment } from '@/modules/forums/store';
import { CommentItem } from './comment-item';

export interface CommentListProps {
  readonly comments: readonly Comment[];
  readonly isLoading: boolean;
  readonly onVote: (id: string, value: 1 | -1, currentVote: 1 | -1 | null) => void;
  readonly replyingTo: string | null;
  readonly setReplyingTo: (id: string | null) => void;
  readonly replyContent: string;
  readonly setReplyContent: (value: string) => void;
  readonly onSubmitReply: (parentId: string) => void;
  readonly isSubmitting: boolean;
}

export function CommentList({
  comments,
  isLoading,
  onVote,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  isSubmitting,
}: CommentListProps) {
  if (isLoading) {
    return (
      <div className="mt-4 flex justify-center py-8">
        <InlineLoadingSpinner label="Loading comments" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="mt-4 py-8 text-center text-[var(--token-text-secondary)]">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onVote={onVote}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
          onSubmitReply={onSubmitReply}
          isSubmitting={isSubmitting}
        />
      ))}
    </div>
  );
}
