/**
 * ForumContent — renders sanitized HTML with code highlighting and spoiler toggles.
 *
 * Replaces raw `dangerouslySetInnerHTML` usage in post-content and comment-card
 * by adding post-render enhancements:
 * - Prism.js syntax highlighting for `<code class="language-*">` blocks
 * - Click-to-toggle spoiler blocks (`.bbcode-spoiler`)
 */
import { useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';

import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-elixir';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';

import './forum-content.css';

interface ForumContentProps {
  html: string;
  className?: string;
}

export function ForumContent({ html, className = '' }: ForumContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // Syntax-highlight all code blocks with a language class
    Prism.highlightAllUnder(container);

    // Wire spoiler toggle buttons
    const toggles = container.querySelectorAll<HTMLButtonElement>('.spoiler-toggle');
    const handlers: Array<[HTMLButtonElement, () => void]> = [];

    toggles.forEach((toggle) => {
      const handler = () => {
        const content = toggle.nextElementSibling;
        if (!content) return;

        const isHidden = content.classList.toggle('spoiler-hidden');
        toggle.classList.toggle('spoiler-open', !isHidden);
      };
      toggle.addEventListener('click', handler);
      handlers.push([toggle, handler]);
    });

    return () => {
      handlers.forEach(([el, fn]) => el.removeEventListener('click', fn));
    };
  }, [html]);

  return (
    <div
      ref={ref}
      className={`forum-content ${className}`}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }),
      }}
    />
  );
}
