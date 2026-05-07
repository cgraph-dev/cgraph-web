import { SafeHtml } from '@/shared/components/security';

interface ContentPreviewProps {
  title: string;
  content: string;
}

/** Content Preview. */
export function ContentPreview({ title, content }: ContentPreviewProps) {
  return (
    <div className="prose prose-invert min-h-[200px] max-w-none rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-4">
      <h1>{title || 'Post Title'}</h1>
      <SafeHtml html={content || '<p>Your content will appear here...</p>'} />
    </div>
  );
}

export default ContentPreview;
