/**
 * BannerEditor — drag-and-drop banner upload with optimistic preview.
 *
 * 5:2 drop zone, validates ≤ 8 MB image/*, shows preview via createObjectURL.
 * Uses `<form action=>` (React 19) and `motion/react` for animations.
 *
 */

import { useState, useRef, useActionState, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const ACCEPTED_TYPES = 'image/*';

interface BannerEditorProps {
  /** Current banner URL (from CDN) or null if none set. */
  readonly currentBannerUrl: string | null;
  /** Upload handler — receives validated File. */
  readonly onUpload: (file: File) => Promise<void>;
  /** Remove the current banner. */
  readonly onRemove: () => Promise<void>;
  /** Whether an upload is in flight (from parent). */
  readonly isUploading: boolean;
}

// Validation

interface ValidationResult {
  readonly valid: boolean;
  readonly error: string | null;
}

function validateFile(file: File): ValidationResult {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Only image files are accepted.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File must be 8 MB or smaller.' };
  }
  return { valid: true, error: null };
}

// Action state

interface BannerState {
  readonly previewUrl: string | null;
  readonly error: string | null;
  readonly success: boolean;
}

const INITIAL_STATE: BannerState = { previewUrl: null, error: null, success: false };

/** Banner upload and preview editor with drag-and-drop support. */
export function BannerEditor({
  currentBannerUrl,
  onUpload,
  onRemove,
  isUploading,
}: BannerEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const formAction = async (_prev: BannerState, formData: FormData): Promise<BannerState> => {
      const file = formData.get('banner');
      if (!(file instanceof File) || file.size === 0) {
        return { previewUrl: null, error: 'No file selected.', success: false };
      }

      const validation = validateFile(file);
      if (!validation.valid) {
        return { previewUrl: null, error: validation.error, success: false };
      }

      // Optimistic preview
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);

      try {
        await onUpload(file);
        return { previewUrl: null, error: null, success: true };
      } catch (err) {
        // Revoke failed preview
        URL.revokeObjectURL(objectUrl);
        setLocalPreview(null);
        const message = err instanceof Error ? err.message : 'Upload failed.';
        return { previewUrl: null, error: message, success: false };
      }
    };

  const [state, dispatch, isPending] = useActionState(formAction, INITIAL_STATE);
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) return;

    // Set the file on the hidden input and submit the form
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      fileInputRef.current.form?.requestSubmit();
    }
  };
  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    fileInputRef.current?.form?.requestSubmit();
  };
  const handleRemove = async () => {
    setLocalPreview(null);
    await onRemove();
  };
  const displayUrl = localPreview ?? currentBannerUrl;
  const isBusy = isUploading || isPending;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-white">Profile Banner</h3>

      <form action={dispatch}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          name="banner"
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Upload banner image"
        />

        {/* 5:2 aspect ratio container */}
        <div
          className="relative overflow-hidden rounded-xl border border-dashed transition-colors"
          style={{ aspectRatio: '5 / 2' }}
        >
          <AnimatePresence mode="wait">
            {displayUrl ? (
              /* ── Current / preview banner ──────────────────────── */
              <motion.div
                key="banner-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <img src={displayUrl} alt="Banner preview" className="h-full w-full object-cover" loading="lazy" />

                {/* Overlay controls */}
                <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isBusy}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 disabled:opacity-50"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRemove()}
                      disabled={isBusy}
                      className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 backdrop-blur-sm transition-colors hover:bg-red-500/30 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Upload overlay */}
                {isBusy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                      <span className="text-xs text-white/80">Uploading…</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ── Drop zone ─────────────────────────────────────── */
              <motion.div
                key="drop-zone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                role="button"
                tabIndex={0}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                }}
                className={`absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 transition-colors ${
                  isDragging
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-white/20 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
                }`}
              >
                {/* Upload icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-8 w-8 text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-400">Upload Banner</span>
                <span className="text-xs text-gray-500">PNG, JPG, WebP · Max 8 MB · 5:2 ratio</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Error message */}
      {state.error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400"
        >
          {state.error}
        </motion.p>
      )}
    </div>
  );
}
