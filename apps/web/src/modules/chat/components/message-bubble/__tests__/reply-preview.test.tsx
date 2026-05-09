/** @module ReplyPreview tests */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReplyPreview } from '../reply-preview';

vi.mock('@/lib/animations/transitions/helpers', () => ({
  getReducedMotion: () => false,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/stores/theme/themeStore', () => ({
  useThemeStore: (selector: (s: { colorPreset: string }) => unknown) =>
    selector({ colorPreset: 'purple' }),
  COLORS: {
    emerald: { primary: 'rgb(16, 185, 129)' },
    purple: { primary: 'rgb(139, 92, 246)' },
    cyan: { primary: 'rgb(6, 182, 212)' },
  },
}));

function clearBody(): void {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
}

describe('ReplyPreview', () => {
  let scrollSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollSpy,
    });
  });

  afterEach(() => {
    clearBody();
    vi.clearAllMocks();
  });

  it('renders the author name and snippet content', () => {
    render(
      <ReplyPreview
        replyToId="msg-42"
        authorName="Alice"
        snippet="Hey, did you see the new build?"
        isOwn={false}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Hey, did you see the new build?')).toBeInTheDocument();
  });

  it('truncates snippets longer than the limit with an ellipsis', () => {
    const longSnippet = 'a'.repeat(120);
    render(
      <ReplyPreview replyToId="msg-42" authorName="Alice" snippet={longSnippet} isOwn={false} />
    );

    const snippetEl = screen.getByText(/a+…$/);
    expect(snippetEl).toBeInTheDocument();
    // 79 a's + ellipsis = 80 chars
    expect(snippetEl.textContent?.length ?? 0).toBeLessThanOrEqual(80);
  });

  it('renders a fallback label when both author and snippet are missing', () => {
    render(<ReplyPreview replyToId="msg-42" authorName={null} snippet={null} isOwn={false} />);

    expect(screen.getByText('Replying to a message…')).toBeInTheDocument();
  });

  it('scrolls the target element into view on click when it exists', () => {
    const target = document.createElement('div');
    target.id = 'message-msg-42';
    document.body.appendChild(target);

    render(<ReplyPreview replyToId="msg-42" authorName="Alice" snippet="hello" isOwn={false} />);

    fireEvent.click(screen.getByRole('button'));
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });

  it('is a no-op when the target message is not in the DOM', () => {
    render(
      <ReplyPreview replyToId="missing-id" authorName="Alice" snippet="hello" isOwn={false} />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
