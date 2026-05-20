import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import {
  ArrowPathIcon,
  CameraIcon,
  CheckIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from '@/components/feedback/toast';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
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
  onAvatarCropped: (payload: CroppedAvatarPayload) => void;
}

const previewSizeClass: Record<NonNullable<AvatarUploadCropperProps['size']>, string> = {
  medium: 'h-20 w-20',
  large: 'h-24 w-24',
  xlarge: 'h-32 w-32',
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
  avatarBorderId,
  disabled = false,
  maxFileSizeMb = 5,
  size = 'large',
  label = 'Profile picture',
  helperText = 'JPG, PNG, GIF, or WebP. Crop before saving.',
  className,
  onAvatarCropped,
}: AvatarUploadCropperProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl ?? null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    setPreviewUrl(avatarUrl ?? null);
  }, [avatarUrl]);

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
        setCropImageSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleConfirmCrop() {
    if (!cropImageSrc || !croppedAreaPixels) return;

    setIsCropping(true);
    try {
      const blob = await getCroppedBlob(cropImageSrc, croppedAreaPixels);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const nextPreviewUrl = URL.createObjectURL(blob);
      setPreviewUrl(nextPreviewUrl);
      setCropImageSrc(null);
      onAvatarCropped({ blob, file, previewUrl: nextPreviewUrl });
    } catch {
      toast.error('Could not crop this image');
    } finally {
      setIsCropping(false);
    }
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={cn(
          'focus-visible:ring-primary-400/70 group relative rounded-full p-[3px] transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
          previewSizeClass[size]
        )}
        aria-label="Choose avatar image"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 via-sky-400 to-purple-500 opacity-70 transition group-hover:opacity-100" />
        <div className="relative h-full w-full overflow-hidden rounded-full bg-[var(--token-bg-secondary)] ring-1 ring-white/10">
          {previewUrl ? (
            <ThemedAvatar
              src={previewUrl}
              alt={`${displayName || 'User'} avatar preview`}
              size={size}
              className="h-full w-full rounded-full"
              avatarBorderId={avatarBorderId}
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
        disabled={disabled}
        className="hover:border-primary-400/50 focus-visible:ring-primary-400/60 inline-flex items-center gap-2 rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--token-text-primary)] transition hover:bg-[var(--token-bg-tertiary)] focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {previewUrl ? (
          <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
        ) : (
          <PhotoIcon className="h-4 w-4" aria-hidden="true" />
        )}
        {previewUrl ? 'Change Image' : 'Upload Image'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--token-border-muted)] bg-[var(--token-bg-primary)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--token-border-muted)] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--token-text-primary)]">
                  Crop avatar
                </h2>
                <p className="mt-1 text-xs text-[var(--token-text-muted)]">
                  Center your face or logo inside the circle.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCropImageSrc(null)}
                className="rounded-lg p-2 text-[var(--token-text-muted)] transition hover:bg-white/10 hover:text-[var(--token-text-primary)]"
                aria-label="Close crop dialog"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative h-[360px] w-full bg-black">
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

            <div className="space-y-4 px-5 py-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--token-text-muted)]">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-primary-500"
                aria-label="Avatar zoom"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--token-border-muted)] px-5 py-4">
              <button
                type="button"
                onClick={() => setCropImageSrc(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--token-text-secondary)] transition hover:bg-white/10 hover:text-[var(--token-text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                disabled={isCropping || !croppedAreaPixels}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                {isCropping ? 'Cropping...' : 'Apply Crop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
