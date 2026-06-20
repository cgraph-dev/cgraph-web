import { type ChangeEvent, type CSSProperties, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import {
  ArrowPathIcon,
  CameraIcon,
  CheckIcon,
  MinusIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from '@/components/feedback/toast';
import { cn } from '@/lib/utils';

export interface CroppedAvatarPayload {
  blob: Blob;
  file: File;
  previewUrl: string;
}

interface AvatarUploadCropperProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  avatarBorderId?: string | null;
  disabled?: boolean;
  maxFileSizeMb?: number;
  size?: 'medium' | 'large' | 'xlarge';
  label?: string;
  helperText?: string;
  className?: string;
  saveLabel?: string;
  onAvatarCropped: (payload: CroppedAvatarPayload) => void | Promise<void>;
}

const previewSizePx: Record<NonNullable<AvatarUploadCropperProps['size']>, number> = {
  medium: 80,
  large: 96,
  xlarge: 128,
};

/** Builds the initials shown before a user selects an avatar image. */
function initialsFor(displayName?: string | null): string {
  return (displayName || 'User').trim().charAt(0).toUpperCase() || 'U';
}

/** Loads a local image URL so the selected crop can be rendered onto a canvas. */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

/** Converts the selected square crop into the JPEG blob uploaded to the backend. */
async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create image crop');

  canvas.width = crop.width;
  canvas.height = crop.height;
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not export cropped image'))),
      'image/jpeg',
      0.92
    );
  });
}

/** Shared avatar upload UI with local preview, crop controls, and validation. */
export function AvatarUploadCropper({
  avatarUrl,
  displayName,
  disabled = false,
  maxFileSizeMb = 5,
  size = 'large',
  label = 'Profile picture',
  helperText = 'JPG, PNG, GIF, or WebP. Crop before saving.',
  className,
  saveLabel = 'Use Avatar',
  onAvatarCropped,
}: AvatarUploadCropperProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ownedObjectUrlsRef = useRef<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl ?? null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [sourceImageSrc, setSourceImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<CroppedAvatarPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!pendingPayload) {
      setPreviewUrl(avatarUrl ?? null);
    }
  }, [avatarUrl, pendingPayload]);

  useEffect(
    () => () => {
      ownedObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      ownedObjectUrlsRef.current.clear();
    },
    []
  );

  function revokeOwnedObjectUrl(url: string | undefined) {
    if (url?.startsWith('blob:') && ownedObjectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      ownedObjectUrlsRef.current.delete(url);
    }
  }

  function rememberOwnedObjectUrl(url: string | undefined) {
    if (url?.startsWith('blob:')) {
      ownedObjectUrlsRef.current.add(url);
    }
  }

  function replacePendingPayload(payload: CroppedAvatarPayload | null, revokePrevious = true) {
    setPendingPayload((previous) => {
      if (revokePrevious) {
        revokeOwnedObjectUrl(previous?.previewUrl);
      }
      if (payload?.previewUrl?.startsWith('blob:')) {
        ownedObjectUrlsRef.current.add(payload.previewUrl);
      }
      return payload;
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > maxFileSizeMb * 1024 * 1024) {
      toast.error(`Image must be ${maxFileSizeMb} MB or smaller`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setSourceImageSrc(reader.result);
        setCropImageSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function closeCropDialog() {
    setCropImageSrc(null);
    if (!pendingPayload) {
      setSourceImageSrc(null);
    }
  }

  function adjustZoom(delta: number) {
    setZoom((current) => Math.min(3, Math.max(1, Number((current + delta).toFixed(2)))));
  }

  useEffect(() => {
    if (!cropImageSrc) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setCropImageSrc(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cropImageSrc]);

  async function handleConfirmCrop() {
    if (!cropImageSrc || !croppedAreaPixels) return;

    setIsCropping(true);
    let nextPreviewUrl: string | undefined;
    try {
      const blob = await getCroppedBlob(cropImageSrc, croppedAreaPixels);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      nextPreviewUrl = URL.createObjectURL(blob);
      const payload = { blob, file, previewUrl: nextPreviewUrl };
      rememberOwnedObjectUrl(nextPreviewUrl);
      setPreviewUrl(nextPreviewUrl);
      replacePendingPayload(payload);
      setCropImageSrc(null);
    } catch (error) {
      if (nextPreviewUrl) {
        revokeOwnedObjectUrl(nextPreviewUrl);
        setPreviewUrl(avatarUrl ?? null);
      }
      toast.error(error instanceof Error ? 'Could not prepare avatar. Please try again.' : 'Could not crop this image');
    } finally {
      setIsCropping(false);
    }
  }

  async function handleSavePending() {
    if (!pendingPayload) return;

    setIsSubmitting(true);
    try {
      await onAvatarCropped(pendingPayload);
      replacePendingPayload(null, false);
      setSourceImageSrc(null);
    } catch {
      // Keep the pending crop available so the caller can retry or cancel.
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEditPendingCrop() {
    if (!sourceImageSrc) {
      inputRef.current?.click();
      return;
    }
    setCropImageSrc(sourceImageSrc);
  }

  function handleCancelPending() {
    replacePendingPayload(null);
    setSourceImageSrc(null);
    setCropImageSrc(null);
    setPreviewUrl(avatarUrl ?? null);
  }

  const hasPendingAvatar = Boolean(pendingPayload);
  const controlsDisabled = disabled || isSubmitting;
  const previewPixelSize = previewSizePx[size];
  const isSavingCrop = isCropping || isSubmitting;
  const previewButtonStyle: CSSProperties = {
    width: previewPixelSize,
    height: previewPixelSize,
    minWidth: previewPixelSize,
    minHeight: previewPixelSize,
    maxWidth: previewPixelSize,
    maxHeight: previewPixelSize,
    borderRadius: '9999px',
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={controlsDisabled}
        className="focus-visible:ring-primary-400/70 group relative shrink-0 rounded-full p-[3px] transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
        style={previewButtonStyle}
        aria-label="Choose avatar image"
        data-testid="avatar-upload-preview-button"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 via-sky-400 to-purple-500 opacity-70 transition group-hover:opacity-100" />
        <div className="relative h-full w-full overflow-hidden rounded-full bg-[var(--token-bg-secondary)] ring-1 ring-white/10">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`${displayName || 'User'} avatar preview`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600 text-3xl font-bold text-white">
              {initialsFor(displayName)}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
            <CameraIcon className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
        </div>
      </button>

      <div className="text-center">
        <p className="text-sm font-semibold text-[var(--token-text-primary)]">{label}</p>
        <p className="mt-1 max-w-xs text-xs text-[var(--token-text-muted)]">{helperText}</p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={controlsDisabled}
        className="hover:border-primary-400/50 focus-visible:ring-primary-400/60 inline-flex items-center gap-2 rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--token-text-primary)] transition hover:bg-[var(--token-bg-tertiary)] focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {previewUrl ? (
          <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
        ) : (
          <PhotoIcon className="h-4 w-4" aria-hidden="true" />
        )}
        {previewUrl ? 'Change Image' : 'Upload Image'}
      </button>

      {hasPendingAvatar && (
        <div className="flex max-w-sm flex-col items-center gap-2 rounded-2xl border border-primary-400/30 bg-primary-500/10 px-4 py-3 text-center">
          <p className="text-xs font-medium text-[var(--token-text-secondary)]">
            Preview ready. Save it now, edit the crop, or cancel.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleSavePending}
              disabled={controlsDisabled}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckIcon className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? 'Saving...' : saveLabel}
            </button>
            <button
              type="button"
              onClick={handleEditPendingCrop}
              disabled={controlsDisabled}
              className="rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--token-text-primary)] transition hover:bg-[var(--token-bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Edit Crop
            </button>
            <button
              type="button"
              onClick={handleCancelPending}
              disabled={controlsDisabled}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--token-text-muted)] transition hover:bg-white/10 hover:text-[var(--token-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {cropImageSrc &&
        createPortal(
          <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="avatar-crop-title"
        >
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--token-border-muted)] bg-[var(--token-bg-primary)] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--token-border-muted)] px-5 py-4">
              <div>
                <h2
                  id="avatar-crop-title"
                  className="text-base font-semibold text-[var(--token-text-primary)]"
                >
                  Crop avatar
                </h2>
                <p className="mt-1 text-xs text-[var(--token-text-muted)]">
                  Center your face or logo inside the circle.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCropDialog}
                className="rounded-lg p-2 text-[var(--token-text-muted)] transition hover:bg-white/10 hover:text-[var(--token-text-primary)]"
                aria-label="Close crop dialog"
                disabled={isSavingCrop}
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative h-[min(360px,52vh)] min-h-[260px] w-full bg-black">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            </div>

            <div className="shrink-0 space-y-3 px-5 py-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--token-text-muted)]">
                Zoom
              </label>
              <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustZoom(-0.1)}
                  disabled={zoom <= 1 || isSavingCrop}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] text-[var(--token-text-primary)] transition hover:bg-[var(--token-bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Zoom out"
                >
                  <MinusIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  disabled={isSavingCrop}
                  className="w-full accent-primary-500"
                  aria-label="Avatar zoom"
                />
                <button
                  type="button"
                  onClick={() => adjustZoom(0.1)}
                  disabled={zoom >= 3 || isSavingCrop}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] text-[var(--token-text-primary)] transition hover:bg-[var(--token-bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Zoom in"
                >
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-[var(--token-border-muted)] px-5 py-4">
              <button
                type="button"
                onClick={closeCropDialog}
                disabled={isSavingCrop}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--token-text-secondary)] transition hover:bg-white/10 hover:text-[var(--token-text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                disabled={isSavingCrop || !croppedAreaPixels}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                {isSavingCrop ? 'Preparing...' : 'Apply crop'}
              </button>
            </div>
          </div>
        </div>,
          document.body
        )}
    </div>
  );
}
