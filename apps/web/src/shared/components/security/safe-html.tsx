import type { HTMLAttributes, Ref } from 'react';
import DOMPurify from 'dompurify';
import { sanitizeCss } from '@/lib/security/css-sanitization';

type SanitizeOptions = NonNullable<Parameters<typeof DOMPurify.sanitize>[1]>;
type SanitizedMarkup = {
  dangerouslySetInnerHTML: {
    __html: string;
  };
};

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

function toSanitizedHtmlSink(html: string, options: SanitizeOptions): SanitizedMarkup {
  return {
    dangerouslySetInnerHTML: {
      __html: sanitizeHtml(html, options),
    },
  };
}

function toSanitizedStyleSink(css: string): SanitizedMarkup {
  return {
    dangerouslySetInnerHTML: {
      __html: sanitizeCss(css),
    },
  };
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
  return <div ref={ref} {...props} {...toSanitizedHtmlSink(html, options)} />;
}

/**
 * Renders sanitized CSS for trusted style injection sites.
 */
export function SafeStyle({ css }: { css: string }) {
  return <style {...toSanitizedStyleSink(css)} />;
}
