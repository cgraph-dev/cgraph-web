import type { HTMLAttributes, Ref } from 'react';
import DOMPurify from 'dompurify';
import { sanitizeCss } from '@/lib/security/css-sanitization';

type SanitizeOptions = NonNullable<Parameters<typeof DOMPurify.sanitize>[1]>;

const DEFAULT_HTML_OPTIONS: SanitizeOptions = {
  USE_PROFILES: { html: true },
};

export interface SafeHtmlProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'dangerouslySetInnerHTML'
> {
  html: string;
  options?: SanitizeOptions;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Sanitizes untrusted HTML before it reaches a DOM sink.
 */
export function sanitizeHtml(
  html: string,
  options: SanitizeOptions = DEFAULT_HTML_OPTIONS
): string {
  return DOMPurify.sanitize(html, options);
}

/**
 * Escapes text for contexts that need literal HTML entity output.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders sanitized HTML through the audited application wrapper.
 */
export function SafeHtml({ html, options = DEFAULT_HTML_OPTIONS, ref, ...props }: SafeHtmlProps) {
  return (
    <div ref={ref} {...props} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html, options) }} />
  );
}

/**
 * Renders sanitized CSS for trusted style injection sites.
 */
export function SafeStyle({ css }: { css: string }) {
  return <style dangerouslySetInnerHTML={{ __html: sanitizeCss(css) }} />;
}
