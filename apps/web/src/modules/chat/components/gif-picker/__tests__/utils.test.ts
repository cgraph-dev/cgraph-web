import { describe, expect, it } from 'vitest';
import { normalizeGifSearchResponse } from '../utils';

describe('normalizeGifSearchResponse', () => {
  it('normalizes the wrapped CGraph GIF response', () => {
    expect(
      normalizeGifSearchResponse({
        data: {
          gifs: [
            {
              id: 'launch-proof',
              title: 'Launch proof',
              media: {
                gif: {
                  url: 'https://media.klipy.test/launch.gif',
                  dims: [320, 180],
                },
                tinygif: {
                  url: 'https://media.klipy.test/launch-preview.gif',
                  dims: [160, 90],
                },
              },
            },
          ],
          next: 'next-page',
        },
      })
    ).toEqual({
      gifs: [
        {
          id: 'launch-proof',
          title: 'Launch proof',
          url: 'https://media.klipy.test/launch.gif',
          previewUrl: 'https://media.klipy.test/launch-preview.gif',
          width: 320,
          height: 180,
          source: 'klipy',
        },
      ],
      next: 'next-page',
    });
  });

  it('uses the validated preview media when the full media has no dimensions', () => {
    const result = normalizeGifSearchResponse({
      data: {
        gifs: [
          {
            id: 'preview-sized',
            title: '',
            media: {
              gif: { url: 'https://media.klipy.test/full.gif' },
              preview: {
                url: 'https://media.klipy.test/preview.gif',
                dims: [200, 125],
              },
            },
          },
        ],
      },
    });

    expect(result.gifs[0]).toMatchObject({
      title: 'GIF',
      previewUrl: 'https://media.klipy.test/preview.gif',
      width: 200,
      height: 125,
    });
  });

  it('rejects invalid URLs, dimensions, identifiers, and non-object entries', () => {
    const result = normalizeGifSearchResponse({
      data: {
        gifs: [
          null,
          { id: '', media: { gif: { url: 'https://media.klipy.test/empty-id.gif' } } },
          {
            id: 'unsafe-url',
            media: { gif: { url: 'javascript:alert(1)', dims: [320, 180] } },
          },
          {
            id: 'invalid-size',
            media: { gif: { url: 'https://media.klipy.test/invalid.gif', dims: [0, 180] } },
          },
        ],
      },
    });

    expect(result).toEqual({ gifs: [], next: null });
  });

  it('returns an empty page instead of generating fake media', () => {
    expect(normalizeGifSearchResponse({ data: { gifs: [] } })).toEqual({
      gifs: [],
      next: null,
    });
    expect(normalizeGifSearchResponse({ error: 'provider unavailable' })).toEqual({
      gifs: [],
      next: null,
    });
  });
});
