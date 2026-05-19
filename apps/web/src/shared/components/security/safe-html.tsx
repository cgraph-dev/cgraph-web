import { createElement, useMemo, type HTMLAttributes, type ReactNode, type Ref } from 'react';
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

const REACT_ATTRIBUTE_NAMES: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
};

function toReactProps(element: Element, key: string): Record<string, string> {
  const props: Record<string, string> = { key };

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase();

    if (name.startsWith('on') || name === 'style') {
      continue;
    }

    props[REACT_ATTRIBUTE_NAMES[name] ?? attribute.name] = attribute.value;
  }

  if (props.target === '_blank') {
    props.rel = props.rel || 'noopener noreferrer';
  }

  return props;
}

function toReactNode(node: ChildNode, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (!(node instanceof Element)) {
    return null;
  }

  const children = Array.from(node.childNodes).map((child, index) =>
    toReactNode(child, `${key}-${index}`)
  );

  return createElement(node.tagName.toLowerCase(), toReactProps(node, key), ...children);
}

function sanitizedHtmlToReactNodes(html: string): ReactNode[] {
  if (typeof DOMParser === 'undefined') {
    return [html];
  }

  const document = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(document.body.childNodes).map((node, index) => toReactNode(node, `${index}`));
}

function useSanitizedHtmlNodes(html: string, options: SanitizeOptions): ReactNode[] {
  return useMemo(() => {
    const sanitized = sanitizeHtml(html, options);
    return sanitizedHtmlToReactNodes(sanitized);
  }, [html, options]);
}

function useSanitizedCss(css: string): string {
  return useMemo(() => sanitizeCss(css), [css]);
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
  const nodes = useSanitizedHtmlNodes(html, options);

  return (
    <div ref={ref} {...props}>
      {nodes}
    </div>
  );
}

/**
 * Renders sanitized CSS for trusted style injection sites.
 */
export function SafeStyle({ css }: { css: string }) {
  const sanitizedCss = useSanitizedCss(css);

  return <style>{sanitizedCss}</style>;
}
