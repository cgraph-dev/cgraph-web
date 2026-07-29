import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';

export interface CommentInputProps {
  readonly isLocked: boolean;
  readonly username?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly isSubmitting: boolean;
}

export function CommentInput({
  isLocked,
  username,
  value,
  onChange,
  onSubmit,
  isSubmitting,
}: CommentInputProps) {
  if (isLocked) {
    return (
      <div className="cgraph-card mt-4 border border-[var(--token-status-warning)] p-4">
        <div className="flex items-center gap-3 text-[var(--token-status-warning)]">
          <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          <p className="text-sm">This post is locked. New comments are disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cgraph-card mt-4 border border-[var(--token-border-default)] p-4">
      <p className="mb-2 text-sm text-[var(--token-text-secondary)]">
        Comment as{' '}
        <span className="font-medium text-[var(--token-interactive-primary)]">
          {username ?? 'your account'}
        </span>
      </p>
      <Textarea
        aria-label="Comment"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What are your thoughts?"
        rows={4}
        className="min-h-28 resize-none"
      />
      <div className="mt-2 flex justify-end">
        <Button
          onClick={onSubmit}
          disabled={!value.trim() || isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Posting…' : 'Comment'}
        </Button>
      </div>
    </div>
  );
}
