import { Link } from 'react-router-dom';
import { ArrowLeft, Paperclip, Tag, X } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import MarkdownEditor from '@/components/content/markdown-editor';
import type { PostAttachment } from '@/modules/forums/store';
import AttachmentUploader from '@/modules/forums/components/attachment-uploader';
import { ForumPageLoadingState } from '@/pages/forums/forum-page-loading-state';
import { useCreatePost } from './hooks';
import PostTypeTabs from './post-type-tabs';

export default function CreatePost() {
  const {
    forumSlug,
    forum,
    canPost,
    postType,
    setPostType,
    title,
    setTitle,
    content,
    setContent,
    url,
    setUrl,
    isSubmitting,
    isJoining,
    error,
    setError,
    selectedPrefix,
    setSelectedPrefix,
    attachments,
    setAttachments,
    threadPrefixes,
    handleJoinForum,
    handleSubmit,
  } = useCreatePost();

  if (!forum) {
    return <ForumPageLoadingState label="Loading post composer" />;
  }

  const prefixOptions = [
    { value: '', label: 'No prefix' },
    ...threadPrefixes.map((prefix) => ({ value: prefix.id, label: prefix.name })),
  ];

  const addAttachment = (attachment: PostAttachment) => {
    setAttachments([...attachments, attachment]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((attachment) => attachment.id !== id));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--token-bg-primary)]">
      <div className="animate-fadeIn mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            to={`/forums/${forumSlug}`}
            aria-label={`Back to ${forum.name}`}
            title={`Back to ${forum.name}`}
            className="cgraph-control cgraph-control-icon cgraph-control-ghost inline-flex p-2 text-[var(--token-text-secondary)]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--token-text-primary)]">Create a post</h1>
            <p className="text-sm text-[var(--token-text-secondary)]">
              in{' '}
              <Link
                to={`/forums/${forumSlug}`}
                className="font-medium text-[var(--token-interactive-primary)] hover:text-[var(--token-interactive-hover)]"
              >
                c/{forum.name}
              </Link>
            </p>
          </div>
        </div>

        {error && (
          <div
            className="cgraph-section-surface mb-6 flex items-center justify-between gap-3 border-[var(--token-feedback-error)] p-4"
            role="alert"
          >
            <span className="text-sm text-[var(--token-feedback-error)]">{error}</span>
            <IconButton
              icon={<X aria-hidden="true" />}
              label="Dismiss error"
              variant="danger"
              size="sm"
              onClick={() => setError(null)}
            />
          </div>
        )}

        {!canPost && (
          <div className="cgraph-section-surface mb-6 flex flex-wrap items-center justify-between gap-3 border-[var(--token-status-warning)] p-4">
            <p className="text-sm text-[var(--token-status-warning)]">
              Join this forum before creating a post.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleJoinForum}
              isLoading={isJoining}
            >
              {isJoining ? 'Joining…' : 'Join forum'}
            </Button>
          </div>
        )}

        <PostTypeTabs postType={postType} setPostType={setPostType} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Title"
              type="text"
              placeholder="Give your post a clear title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              size="lg"
              required
            />
            <div
              className="mt-1 text-right text-xs text-[var(--token-text-muted)]"
              aria-live="polite"
            >
              {title.length}/300
            </div>
          </div>

          {threadPrefixes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[var(--token-text-secondary)]">
                <Tag className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-medium">Thread organization</span>
              </div>
              <Select
                label="Prefix"
                value={selectedPrefix}
                onChange={(event) => setSelectedPrefix(event.target.value)}
                options={prefixOptions}
              />
            </div>
          )}

          {postType === 'text' && (
            <div>
              <MarkdownEditor
                value={content}
                onChange={setContent}
                placeholder="Write your post content... (Markdown supported)"
                minRows={8}
              />
            </div>
          )}

          {postType === 'image' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--token-text-secondary)]">Images</p>
              <AttachmentUploader
                attachments={attachments}
                onUpload={addAttachment}
                onDelete={removeAttachment}
                maxFiles={5}
              />
            </div>
          )}

          {postType === 'link' && (
            <Input
              label="Link"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              size="lg"
              required
            />
          )}

          {(postType === 'text' || postType === 'link' || postType === 'poll') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[var(--token-text-secondary)]">
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-medium">Attachments</span>
              </div>
              <AttachmentUploader
                attachments={attachments}
                onUpload={addAttachment}
                onDelete={removeAttachment}
                maxFiles={5}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              to={`/forums/${forumSlug}`}
              className="cgraph-control cgraph-control-outline inline-flex items-center justify-center px-6 py-3 text-base font-medium"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !title.trim() || !canPost}
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
