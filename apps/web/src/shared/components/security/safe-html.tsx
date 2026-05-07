import DOMPurify from 'dompurify';
import { forwardRef, type HTMLAttributes } from 'react';

type SafeHtmlProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'dangerouslySetInnerHTML'> & {
  html: string | null | undefined;
};

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function sanitizeHtml(html: string | null | undefined): string {
  return DOMPurify.sanitize(html ?? '', { USE_PROFILES: { html: true } });
}

export function textToSafeHtml(text: string | null | undefined): string {
  return (text ?? '')
    .replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char)
    .replace(/\r?\n/g, '<br />');
}

export const SafeHtml = forwardRef<HTMLDivElement, SafeHtmlProps>(function SafeHtml(
  { html, ...props },
  ref
) {
  return <div ref={ref} {...props} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
});
