/**
 * Adaptive media player that selects the best variant based on connection quality.
 *
 * - Images: renders thumbnail (320px) in chat, full quality in lightbox on click.
 * - Videos: HTML5 video with source switching based on navigator.connection.
 *   3G -> 480p, 4G -> 720p, WiFi/absent -> 1080p. Poster from thumbnail variant.
 * - Audio: waveform visualization from variant metadata (46 bars, Signal pattern).
 *
 * Uses motion/react for expand/collapse transitions.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';

import type { ConnectionQuality, MediaVariant } from '@cgraph/shared-types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdaptiveMediaPlayerProps {
  /** All available variants for this upload. */
  readonly variants: ReadonlyArray<MediaVariant>;
  /** Media type (determines which player to render). */
  readonly mediaType: 'image' | 'video' | 'audio';
  /** Optional blur hash for progressive image loading. */
  readonly blurHash?: string;
  /** Alt text for images. */
  readonly alt?: string;
}

// ---------------------------------------------------------------------------
// Connection quality detection
// ---------------------------------------------------------------------------

function detectConnectionQuality(): ConnectionQuality {
  const connection = 'connection' in navigator ? (navigator.connection ?? undefined) : undefined;
  const effectiveType =
    connection && typeof connection === 'object' && 'effectiveType' in connection
      ? String(connection.effectiveType)
      : undefined;

  const CONNECTION_MAP: Record<string, ConnectionQuality> = {
    'slow-2g': 'slow',
    '2g': 'slow',
    '3g': 'slow',
    '4g': 'medium',
  };

  return CONNECTION_MAP[effectiveType ?? ''] ?? 'fast';
}

function selectVariant(
  variants: ReadonlyArray<MediaVariant>,
  quality: ConnectionQuality
): MediaVariant | undefined {
  const PREFERENCE_MAP: Record<ConnectionQuality, ReadonlyArray<string>> = {
    slow: ['480p', 'thumbnail', 'webp', '720p', '1080p', 'original'],
    medium: ['720p', 'webp', '480p', '1080p', 'original'],
    fast: ['1080p', 'original', '720p', 'webp', '480p'],
  };

  const preference = PREFERENCE_MAP[quality];

  for (const type of preference) {
    const found = variants.find((v) => v.variant_type === type);
    if (found) return found;
  }

  return variants[0];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Selects and renders the appropriate media player based on connection quality and media type. */
function AdaptiveMediaPlayer(props: AdaptiveMediaPlayerProps): ReactNode {
  const { variants, mediaType, blurHash, alt } = props;

  if (variants.length === 0) return null;

  switch (mediaType) {
    case 'image':
      return <ImagePlayer variants={variants} blurHash={blurHash} alt={alt} />;
    case 'video':
      return <VideoPlayer variants={variants} />;
    case 'audio':
      return <AudioWaveformPlayer variants={variants} />;
  }
}

export { AdaptiveMediaPlayer };

// ---------------------------------------------------------------------------
// Image player — thumbnail in chat, full quality on click
// ---------------------------------------------------------------------------

function ImagePlayer(props: {
  readonly variants: ReadonlyArray<MediaVariant>;
  readonly blurHash?: string;
  readonly alt?: string;
}): ReactNode {
  const { variants, alt } = props;
  const [expanded, setExpanded] = useState(false);

  const thumbnail = variants.find((v) => v.variant_type === 'thumbnail');
  const quality = detectConnectionQuality();
  const fullVariant = selectVariant(variants, quality);

  const chatSrc = thumbnail?.url ?? fullVariant?.url ?? '';
  const fullSrc = fullVariant?.url ?? chatSrc;

  return (
    <>
      {/* Chat message thumbnail */}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="overflow-hidden rounded-lg"
      >
        <img
          src={chatSrc}
          alt={alt ?? 'Attached image'}
          className="max-h-64 max-w-xs rounded-lg object-cover"
          loading="lazy"
        />
      </button>

      {/* Lightbox overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
          >
            <motion.img
              src={fullSrc}
              alt={alt ?? 'Full size image'}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// Video player — adaptive source based on connection
// ---------------------------------------------------------------------------

function VideoPlayer(props: { readonly variants: ReadonlyArray<MediaVariant> }): ReactNode {
  const { variants } = props;

  const quality = detectConnectionQuality();
  const videoVariant = selectVariant(
    variants.filter((v) => ['480p', '720p', '1080p'].includes(v.variant_type)),
    quality
  );

  const poster = variants.find((v) => v.variant_type === 'poster');
  const src = videoVariant?.url;

  if (!src) return null;

  return (
    <div className="overflow-hidden rounded-lg">
      <video
        src={src}
        poster={poster?.url}
        controls
        preload="metadata"
        playsInline
        className="max-h-80 max-w-md rounded-lg"
      >
        {/* Fallback sources in descending quality */}
        {variants
          .filter((v) => ['1080p', '720p', '480p'].includes(v.variant_type))
          .sort((a, b) => {
            const ORDER: Record<string, number> = { '1080p': 0, '720p': 1, '480p': 2 };
            return (ORDER[a.variant_type] ?? 3) - (ORDER[b.variant_type] ?? 3);
          })
          .map((v) => (
            <source key={v.variant_type} src={v.url} type={v.content_type || 'video/mp4'} />
          ))}
      </video>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audio waveform player — 46 bars (Signal pattern)
// ---------------------------------------------------------------------------

const WAVEFORM_BAR_COUNT = 46;
const BAR_WIDTH = 3;
const BAR_GAP = 1;
const WAVEFORM_HEIGHT = 32;

function AudioWaveformPlayer(props: { readonly variants: ReadonlyArray<MediaVariant> }): ReactNode {
  const { variants } = props;
  const waveformVariant = variants.find((v) => v.variant_type === 'waveform');
  const rawBars: unknown = waveformVariant?.metadata?.bars ?? [];
  const bars: number[] = Array.isArray(rawBars)
    ? rawBars.filter((b): b is number => typeof b === 'number')
    : [];

  // Pad or trim to exactly 46 bars
  const normalizedBars = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, i) =>
    i < bars.length ? Math.max(0.05, bars[i] ?? 0.05) : 0.05
  );

  const totalWidth = WAVEFORM_BAR_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP;

  const duration = waveformVariant?.duration;
  const durationLabel = duration ? formatDuration(duration) : '';

  return (
    <div className="bg-surface-secondary flex items-center gap-3 rounded-lg px-3 py-2">
      {/* Play button placeholder */}
      <button
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white"
        aria-label="Play audio"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
      </button>

      {/* Waveform SVG */}
      <svg
        width={totalWidth}
        height={WAVEFORM_HEIGHT}
        viewBox={`0 0 ${totalWidth} ${WAVEFORM_HEIGHT}`}
        className="flex-1"
      >
        {normalizedBars.map((amplitude, i) => {
          const barHeight = Math.max(2, amplitude * WAVEFORM_HEIGHT);
          const x = i * (BAR_WIDTH + BAR_GAP);
          const y = (WAVEFORM_HEIGHT - barHeight) / 2;

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={BAR_WIDTH}
              height={barHeight}
              rx={1}
              className="fill-primary/60"
            />
          );
        })}
      </svg>

      {/* Duration */}
      {durationLabel && (
        <span className="text-text-secondary shrink-0 text-xs">{durationLabel}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
