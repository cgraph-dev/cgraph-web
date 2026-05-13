/**
 * ThreadView Hooks
 */

import { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { Comment } from '@/modules/forums/store';
import type { CommentViewMode } from './types';
/** Use View Mode. */
export function useViewMode(defaultViewMode: CommentViewMode) {
  const [viewMode, setViewMode] = useState<CommentViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgraph_thread_view_mode');
      if (saved === 'linear' || saved === 'threaded') {
        return saved;
      }
    }
    return defaultViewMode;
  });

  const handleViewModeChange = (mode: CommentViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgraph_thread_view_mode', mode);
    }
  };

  return { viewMode, handleViewModeChange };
}
/** Use Sorted Comments. */
export function useSortedComments(comments: Comment[]) {
  return (() => {
    return [...comments].sort((a, b) => {
      if (a.isBestAnswer && !b.isBestAnswer) return -1;
      if (!a.isBestAnswer && b.isBestAnswer) return 1;
      return b.score - a.score;
    });
  })();
}
/** Use Comment Virtualizer. */
export function useCommentVirtualizer(comments: Comment[]) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: comments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  return { parentRef, rowVirtualizer };
}
/** Use Reply Handler. */
export function useReplyHandler() {
  const [replyToId, setReplyToId] = useState<string | undefined>(undefined);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const handleReplyTo = (parentId: string) => {
    setReplyToId(parentId);
    setShowCommentForm(true);
    // Scroll to comment form
    setTimeout(() => {
      document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const clearReply = () => {
    setReplyToId(undefined);
  };

  return {
    replyToId,
    showCommentForm,
    setShowCommentForm,
    handleReplyTo,
    clearReply,
    setReplyToId,
  };
}
/** Use Vote Handlers. */
export function useVoteHandlers(
  onVote: (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => Promise<void>,
  postId: string,
  postMyVote: 1 | -1 | null | undefined
) {
  const handlePostVote = async (value: 1 | -1) => {
    HapticFeedback.light();
    const newValue = postMyVote === value ? null : value;
    await onVote('post', postId, newValue);
  };

  const handleCommentVote = async (
    commentId: string,
    value: 1 | -1,
    currentVote: 1 | -1 | null
  ) => {
    HapticFeedback.light();
    const newValue = currentVote === value ? null : value;
    await onVote('comment', commentId, newValue);
  };

  const handleThreadedVote = async (
    commentId: string,
    value: 1 | -1 | null,
    _currentVote: 1 | -1 | null
  ) => {
    await onVote('comment', commentId, value);
  };

  return { handlePostVote, handleCommentVote, handleThreadedVote };
}
/** Use Comment Submit. */
export function useCommentSubmit(
  onComment: (content: string, parentId?: string) => Promise<void>,
  replyToId: string | undefined,
  clearReply: () => void
) {
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const handleSubmitComment = async () => {
    if (!commentContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    HapticFeedback.success();
    try {
      await onComment(commentContent.trim(), replyToId);
      setCommentContent('');
      setShowCommentForm(false);
      clearReply();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    commentContent,
    setCommentContent,
    isSubmitting,
    showCommentForm,
    setShowCommentForm,
    handleSubmitComment,
  };
}
/** Use Rating. */
export function useRating(onRate?: (rating: number) => Promise<void>) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleRate = async (rating: number) => {
    if (!onRate) return;
    HapticFeedback.medium();
    await onRate(rating);
  };

  return { hoveredRating, setHoveredRating, handleRate };
}
