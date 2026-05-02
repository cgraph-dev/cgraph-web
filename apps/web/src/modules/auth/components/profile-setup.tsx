import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { AuthFormInput } from '@/modules/auth/components/auth-form-input';
import { usePhoneRegistrationStore } from '@/modules/auth/store/registration-store';

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas unavailable');
  }

  canvas.width = crop.width;
  canvas.height = crop.height;

  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error('Avatar crop failed'));
      },
      'image/jpeg',
      0.92
    );
  });
}

/**
 * Profile setup step — display name, username, and avatar cropper for new account registration.
 */
export function ProfileSetup(): ReactElement {
  const profile = usePhoneRegistrationStore((state) => state.profile);
  const isSubmitting = usePhoneRegistrationStore((state) => state.isSubmitting);
  const error = usePhoneRegistrationStore((state) => state.error);
  const setProfileField = usePhoneRegistrationStore((state) => state.setProfileField);
  const submitProfile = usePhoneRegistrationStore((state) => state.submitProfile);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarBlobRef = useRef<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setLocalError('Choose an image file for your avatar.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLocalError(null);
        setCropImageSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) {
      return;
    }

    try {
      const croppedBlob = await getCroppedBlob(cropImageSrc, croppedAreaPixels);
      avatarBlobRef.current = croppedBlob;
      setAvatarPreview(URL.createObjectURL(croppedBlob));
      setCropImageSrc(null);
      setZoom(1);
    } catch {
      setLocalError('We could not crop that image. Try another photo.');
    }
  };

  const handleSubmit = async () => {
    const avatarUpload = avatarBlobRef.current ? createAvatarUpload(avatarBlobRef.current) : null;
    void submitProfile(avatarUpload);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-white">Set up your profile</h2>
        <p className="text-sm text-white/60">
          Add your name, pick a photo, and optionally reserve a username now.
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.05] text-3xl font-semibold text-white transition hover:border-white/20"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{profile.displayName.trim().charAt(0).toUpperCase() || '?'}</span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-semibold uppercase tracking-[0.18em] opacity-0 transition group-hover:opacity-100">
              Add Photo
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
          >
            Choose avatar
          </button>
        </div>

        <AuthFormInput
          label="Display name"
          autoFocus
          value={profile.displayName}
          onChange={(event) => setProfileField('displayName', event.target.value)}
          placeholder="Ada Lovelace"
          showValidation={false}
        />

        <AuthFormInput
          label="Username"
          value={profile.username}
          onChange={(event) => setProfileField('username', event.target.value)}
          placeholder="adalovelace"
          autoCapitalize="none"
          autoCorrect="off"
          helperText="Optional. You can claim one later from settings too."
          showValidation={false}
        />
      </div>

      {localError ? <p className="text-sm text-red-300">{localError}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Saving profile…' : 'Continue'}
      </button>

      {cropImageSrc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b1020]">
            <div className="border-b border-white/10 px-5 py-4">
              <h3 className="text-lg font-semibold text-white">Crop your avatar</h3>
              <p className="mt-1 text-sm text-white/50">
                Telegram uses a round avatar preview here. So do we.
              </p>
            </div>
            <div className="relative h-80 w-full bg-black">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, croppedArea) => setCroppedAreaPixels(croppedArea)}
              />
            </div>
            <div className="space-y-4 px-5 py-4">
              <label className="block text-sm text-white/65">
                Zoom
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="mt-3 w-full"
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCropImageSrc(null)}
                  className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 transition hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCropConfirm()}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  Use photo
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function createAvatarUpload(blob: Blob): FormData {
  const formData = new FormData();
  formData.append('file', blob, 'avatar.jpg');
  return formData;
}
