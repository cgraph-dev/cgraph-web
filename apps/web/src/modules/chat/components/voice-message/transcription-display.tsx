/**
 * Display component for voice message transcription text.
 *
 * Shows the transcription text below the voice waveform with an
 * expand/collapse animation (Telegram pattern: starts collapsed
 * at 2 lines, tap to expand). Includes a language tag and copy button.
 *
 * Uses AnimatePresence from motion/react for reveal animation.
 */
import { type ReactNode, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('TranscriptionDisplay');

interface TranscriptionDisplayProps {
  /** The transcription text to display. */
  readonly text: string;
  /** Detected language code (e.g. "en", "es"). */
  readonly language: string | null;
  /** Current transcription status. */
  readonly status: string;
}

/**
 * Renders transcription text below the voice waveform.
 *
 * Text starts collapsed at 2 lines with a "Show more" toggle.
 * Includes a language tag and a copy-to-clipboard button.
 */
export function TranscriptionDisplay(props: TranscriptionDisplayProps): ReactNode {
  const { text, language, status } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleExpanded = useCallback((): void => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleCopy = useCallback((): void => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        logger.warn('Failed to copy transcription text');
      });
  }, [text]);

  if (status !== 'completed' || !text) {
    return null;
  }

  const languageLabel = language && language !== 'unknown' ? language.toUpperCase() : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="mt-2 overflow-hidden"
      >
        <div className="bg-muted/50 rounded-lg px-3 py-2">
          {/* Header row: language tag + copy button */}
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {languageLabel ? (
                <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                  {languageLabel}
                </span>
              ) : null}
              <span className="text-muted-foreground text-[10px]">Transcription</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="text-muted-foreground hover:bg-muted inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors hover:text-foreground"
              aria-label="Copy transcription"
            >
              {copied ? (
                <svg
                  className="h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg
                  className="h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                  />
                </svg>
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Transcription text with expand/collapse */}
          <button
            type="button"
            onClick={toggleExpanded}
            className="w-full text-left"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse transcription' : 'Expand transcription'}
          >
            <p
              className={`text-sm leading-relaxed text-foreground/90 transition-all duration-200 ${
                isExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {text}
            </p>
            {/* Show toggle hint only if text is likely longer than 2 lines */}
            {text.length > 120 ? (
              <span className="text-muted-foreground/70 mt-0.5 block text-[10px]">
                {isExpanded ? 'Show less' : 'Show more'}
              </span>
            ) : null}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
