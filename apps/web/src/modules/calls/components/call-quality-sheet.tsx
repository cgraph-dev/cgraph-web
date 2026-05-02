/**
 * Post-call quality feedback bottom sheet.
 *
 * Slides up after a call ends (>= 30 seconds). Contains a star
 * rating (1-5), issue checkboxes (shown for rating <= 3), an
 * optional comment field, and Submit / Skip buttons.
 *
 * WebRTC telemetry stats are auto-attached via the hook.
 */
import { type ReactNode, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CallQualityStars } from './call-quality-stars';
import type { CallQualityRating, CallQualityIssue } from '@cgraph/shared-types';
import { CALL_QUALITY_ISSUES, CALL_QUALITY_ISSUE_LABELS } from '@cgraph/shared-types';

const MAX_COMMENT_LENGTH = 500;

interface CallQualitySheetProps {
  /** Whether the sheet is visible. */
  readonly isOpen: boolean;
  /** Whether a submission is in progress. */
  readonly isSubmitting: boolean;
  /** Error message from submission. */
  readonly error: string | null;
  /** Callback to submit feedback. */
  readonly onSubmit: (
    rating: CallQualityRating,
    issues: readonly CallQualityIssue[],
    comment: string | undefined,
    telemetry: Record<string, unknown>
  ) => Promise<void>;
  /** Callback to dismiss without submitting. */
  readonly onSkip: () => void;
}

/**
 * Validate that a number is a valid CallQualityRating (1-5).
 */
function isValidRating(value: number): value is CallQualityRating {
  return value >= 1 && value <= 5 && Number.isInteger(value);
}

/**
 * Post-call quality feedback bottom sheet / modal.
 *
 * Star rating with dynamic issue checkboxes and optional comment.
 */
export function CallQualitySheet(props: CallQualitySheetProps): ReactNode {
  const { isOpen, isSubmitting, error, onSubmit, onSkip } = props;

  const [rating, setRating] = useState(0);
  const [selectedIssues, setSelectedIssues] = useState<Set<CallQualityIssue>>(new Set());
  const [comment, setComment] = useState('');

  const showIssues = rating > 0 && rating <= 3;

  const handleToggleIssue = useCallback((issue: CallQualityIssue): void => {
    setSelectedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(issue)) {
        next.delete(issue);
      } else {
        next.add(issue);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback((): void => {
    if (!isValidRating(rating)) return;

    const issues = showIssues ? Array.from(selectedIssues) : [];
    const trimmedComment = comment.trim() || undefined;

    onSubmit(rating, issues, trimmedComment, {}).catch(() => {
      // Error handled by hook state
    });
  }, [rating, showIssues, selectedIssues, comment, onSubmit]);

  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value;
    if (value.length <= MAX_COMMENT_LENGTH) {
      setComment(value);
    }
  }, []);

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onSkip}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-2xl p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Rate your call quality"
          >
            {/* Drag handle */}
            <div className="mb-4 flex justify-center">
              <div className="bg-muted-foreground/30 h-1 w-10 rounded-full" />
            </div>

            {/* Title */}
            <h2 className="mb-1 text-center text-lg font-semibold text-foreground">
              How was your call?
            </h2>
            <p className="text-muted-foreground mb-4 text-center text-sm">
              Help us improve call quality
            </p>

            {/* Star rating */}
            <div className="mb-4 flex justify-center">
              <CallQualityStars rating={rating} onRate={setRating} disabled={isSubmitting} />
            </div>

            {/* Issue checkboxes (shown for rating <= 3) */}
            <AnimatePresence>
              {showIssues ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-4 overflow-hidden"
                >
                  <p className="mb-2 text-sm font-medium text-foreground">What went wrong?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CALL_QUALITY_ISSUES.map((issue) => (
                      <label
                        key={issue}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          selectedIssues.has(issue)
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIssues.has(issue)}
                          onChange={() => handleToggleIssue(issue)}
                          disabled={isSubmitting}
                          className="sr-only"
                        />
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border ${
                            selectedIssues.has(issue)
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/30'
                          }`}
                        >
                          {selectedIssues.has(issue) ? (
                            <svg
                              className="text-primary-foreground h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="3"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            </svg>
                          ) : null}
                        </span>
                        {CALL_QUALITY_ISSUE_LABELS[issue]}
                      </label>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Comment field */}
            {rating > 0 ? (
              <div className="mb-4">
                <textarea
                  value={comment}
                  onChange={handleCommentChange}
                  placeholder="Additional comments (optional)"
                  maxLength={MAX_COMMENT_LENGTH}
                  disabled={isSubmitting}
                  rows={2}
                  className="border-border bg-background placeholder:text-muted-foreground w-full resize-none rounded-lg border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <p className="text-muted-foreground mt-1 text-right text-xs">
                  {comment.length}/{MAX_COMMENT_LENGTH}
                </p>
              </div>
            ) : null}
            {error ? (
              <p className="text-destructive mb-3 text-center text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onSkip}
                disabled={isSubmitting}
                className="border-border text-muted-foreground hover:bg-muted flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="text-primary-foreground hover:bg-primary/90 flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
