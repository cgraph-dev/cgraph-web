/**
 * MarkdownContent - Renders markdown-formatted message text
 *
 * Supports: **bold**, *italic*, ~~strikethrough~~, `inline code`,
 * ```code blocks```, > blockquotes, [links](url)
 * Sanitized against XSS by react-markdown without raw HTML injection.
 */

import ReactMarkdown from 'react-markdown';
import { Children, memo, type ReactNode } from 'react';
import { EmojiTextRenderer } from '@/lib/lottie/emoji-text-renderer';

/** Walk React children, replacing plain-text strings with animated emojis. */
function processChildren(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string') {
      return <EmojiTextRenderer text={child} />;
    }
    return child;
  });
}

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent = memo(function MarkdownContent({
  content,
  className = '',
}: MarkdownContentProps) {
  // Skip markdown parsing for very short messages or messages with no markdown syntax
  if (!content || !hasMarkdownSyntax(content)) {
    return (
      <p className={`whitespace-pre-wrap break-words ${className}`}>
        <EmojiTextRenderer text={content} />
      </p>
    );
  }

  return (
    <div className={`markdown-content whitespace-pre-wrap break-words ${className}`}>
      <ReactMarkdown
        components={{
          // Override default elements with styled versions
          p: ({ children }) => <p className="mb-1 last:mb-0">{processChildren(children)}</p>,
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
          code: ({ className: codeClassName, children, ...props }) => {
            // Check if it's a code block (has language class) vs inline code
            const isBlock = codeClassName?.startsWith('language-');
            if (isBlock) {
              return (
                <code
                  className={`bg-[var(--token-card-bg)]/80 block overflow-x-auto rounded-lg p-3 font-mono text-xs text-emerald-300 ${codeClassName || ''}`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="bg-[var(--token-card-bg)]/60 rounded px-1.5 py-0.5 font-mono text-xs text-pink-300"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-1 overflow-hidden rounded-lg">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-primary-500/60 my-1 border-l-2 pl-3 italic text-gray-300">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="decoration-primary-400/30 hover:decoration-primary-300/50 text-primary-400 underline transition-colors hover:text-primary-300"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-1 list-inside list-disc space-y-0.5 text-gray-300">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1 list-inside list-decimal space-y-0.5 text-gray-300">{children}</ol>
          ),
          li: ({ children }) => <li className="text-sm">{processChildren(children)}</li>,
          // Disable images and other potentially dangerous elements
          img: () => null,
          iframe: () => null,
          script: () => null,
        }}
        // Only allow safe markdown elements
        allowedElements={[
          'p',
          'strong',
          'em',
          'del',
          'code',
          'pre',
          'blockquote',
          'a',
          'ul',
          'ol',
          'li',
          'br',
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

/**
 * Quick check if content contains any markdown-like syntax.
 * Avoids unnecessary parsing for plain text messages.
 */
function hasMarkdownSyntax(text: string): boolean {
  return /[*_~`>[\]#-]/.test(text);
}
