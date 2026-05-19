import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SafeHtml, SafeStyle, sanitizeHtml } from './safe-html';

describe('SafeHtml', () => {
  it('renders sanitized markup as React nodes without executing unsafe attributes', () => {
    render(
      <SafeHtml
        html={'<p class="message">Hello <strong>world</strong></p><img src=x onerror=alert(1) />'}
      />
    );

    expect(document.querySelector('.message')).toHaveTextContent('Hello world');
    expect(screen.getByText('world').tagName).toBe('STRONG');
    expect(document.querySelector('img')).not.toHaveAttribute('onerror');
  });

  it('removes scripts and inline styles before rendering', () => {
    render(<SafeHtml html={'<script>alert(1)</script><span style="color:red">safe</span>'} />);

    expect(document.querySelector('script')).not.toBeInTheDocument();
    expect(screen.getByText('safe')).not.toHaveAttribute('style');
  });

  it('does not render opener-capable blank links', () => {
    render(<SafeHtml html={'<a href="https://example.com" target="_blank">open</a>'} />);

    const link = screen.getByRole('link', { name: 'open' });
    expect(link.getAttribute('target')).not.toBe('_blank');
  });
});

describe('SafeStyle', () => {
  it('renders sanitized css as text content', () => {
    const { container } = render(
      <SafeStyle css={'body{color:red;}@import url("https://evil.test")'} />
    );

    expect(container.querySelector('style')).toHaveTextContent('body{color:red;}');
    expect(container.querySelector('style')).not.toHaveTextContent('@import');
  });
});

describe('sanitizeHtml', () => {
  it('returns sanitized html for non-React callers', () => {
    expect(sanitizeHtml('<img src=x onerror=alert(1)>')).not.toContain('onerror');
  });
});
