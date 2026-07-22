import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/api-client';
import { GifPicker } from '../gif-picker';

vi.mock('@/lib/api-client', () => ({
  http: { get: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  authLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function response(id: string, title: string) {
  return {
    data: {
      data: {
        gifs: [
          {
            id,
            title,
            media: {
              gif: { url: `https://media.klipy.test/${id}.gif`, dims: [320, 180] },
              tinygif: {
                url: `https://media.klipy.test/${id}-preview.gif`,
                dims: [160, 90],
              },
            },
          },
        ],
      },
    },
  };
}

describe('GifPicker', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(http.get).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps a stale request from replacing the latest search results', async () => {
    const trending = deferred<ReturnType<typeof response>>();
    const cats = deferred<ReturnType<typeof response>>();
    vi.mocked(http.get)
      .mockImplementationOnce(() => trending.promise)
      .mockImplementationOnce(() => cats.promise);

    render(<GifPicker isOpen onClose={vi.fn()} onSelect={vi.fn()} className="relative" />);

    await waitFor(() => expect(http.get).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByPlaceholderText('Search KLIPY...'), {
      target: { value: 'cats' },
    });
    await waitFor(() => expect(http.get).toHaveBeenCalledTimes(2));

    await act(async () => cats.resolve(response('cats', 'Cats')));
    expect(await screen.findByRole('button', { name: 'Select GIF Cats' })).toBeVisible();

    await act(async () => trending.resolve(response('trending', 'Trending')));
    expect(screen.queryByRole('button', { name: 'Select GIF Trending' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select GIF Cats' })).toBeVisible();
  });

  it('shows a retryable error instead of fake results', async () => {
    vi.mocked(http.get).mockRejectedValue(new Error('provider unavailable'));

    render(<GifPicker isOpen onClose={vi.fn()} onSelect={vi.fn()} className="relative" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'GIF search is temporarily unavailable.'
    );
    expect(screen.queryByRole('button', { name: /select gif/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(http.get).toHaveBeenCalledTimes(2));
  });
});
