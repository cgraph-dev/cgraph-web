/**
 * ProfileEditForm — Full profile editing with avatar cropping.
 *
 * Features:
 * - Avatar preview with crop modal (react-easy-crop, 1:1 aspect)
 * - Display name, bio, signature fields with validation
 * - Saves via PUT /api/v1/me and POST /api/v1/me/avatar
 *
 */

import { useRef, useState } from 'react';
import { http } from '@/lib/api-client';
import { toast } from '@/components/feedback/toast';
import { createLogger } from '@/lib/logger';
import { useAuthStore } from '@/modules/auth/store';
import {
  AvatarUploadCropper,
  type CroppedAvatarPayload,
} from '@/components/avatar/avatar-upload-cropper';
import { uploadCurrentUserAvatar } from '@/lib/avatar-upload';

const logger = createLogger('ProfileEditForm');

// Types

export interface ProfileEditFormProps {
  /** Current user profile data */
  user: {
    avatar_url?: string | null;
    display_name?: string | null;
    bio?: string | null;
    signature?: string | null;
  };
  /** Called after a successful save with the updated fields */
  onSaved?: (updated: Record<string, unknown>) => void;
  /** Called when user cancels editing */
  onCancel?: () => void;
}

// Component

/** Description. */
/** Profile Edit Form component. */
export function ProfileEditForm({ user, onSaved, onCancel }: ProfileEditFormProps) {
  // Form state
  const [displayName, setDisplayName] = useState(user.display_name ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [signature, setSignature] = useState(user.signature ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url ?? null);

  // Upload / save state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track pending avatar blob for upload on save
  const pendingAvatarBlobRef = useRef<Blob | null>(null);

  // Handlers

  function handleAvatarCropped(payload: CroppedAvatarPayload) {
    pendingAvatarBlobRef.current = payload.blob;
    setAvatarPreview(payload.previewUrl);
  }

  async function handleSave() {
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    setIsSaving(true);
    try {
      // Upload avatar if changed — capture the new URL so we can sync the
      // auth store, which is what the sidebar / DM rows / friend list /
      // forum author cards subscribe to. Without this the new avatar
      // wouldn't appear anywhere until a full page reload.
      let newAvatarUrl: string | null = null;
      if (pendingAvatarBlobRef.current) {
        setIsUploadingAvatar(true);
        newAvatarUrl = await uploadCurrentUserAvatar(pendingAvatarBlobRef.current);
        pendingAvatarBlobRef.current = null;
        setIsUploadingAvatar(false);
      }

      // Update profile fields
      const payload: Record<string, string> = {
        display_name: displayName.trim(),
        bio: bio.trim(),
        signature: signature.trim(),
      };

      await http.put('/api/v1/me', { user: payload });

      // Live-sync the auth store so every place that renders the user
      // (sidebar nav, DM headers, friend list, forum author rows, etc.)
      // re-renders with the fresh values without a page reload.
      useAuthStore.getState().updateUser({
        displayName: payload.display_name,
        ...(newAvatarUrl ? { avatarUrl: newAvatarUrl } : {}),
      });

      toast.success('Profile updated!');
      onSaved?.({
        ...payload,
        ...(newAvatarUrl ? { avatar_url: newAvatarUrl } : {}),
      });
    } catch (err) {
      logger.error('Failed to save profile:', err);
      toast.error('Failed to save profile. Please try again.');
      setIsUploadingAvatar(false);
    } finally {
      setIsSaving(false);
    }
  }

  const busy = isSaving || isUploadingAvatar;

  // Render

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      {/* ---- Avatar ---- */}
      <AvatarUploadCropper
        avatarUrl={avatarPreview}
        displayName={displayName}
        disabled={busy}
        label="Profile avatar"
        onAvatarCropped={handleAvatarCropped}
      />

      {/* ---- Display Name ---- */}
      <div className="space-y-1">
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-300">
          Display Name <span className="text-red-400">*</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
          maxLength={50}
          placeholder="Your display name"
          className="w-full rounded-lg border border-[var(--token-border-muted)] bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={busy}
        />
        <p className="text-right text-xs text-gray-500">{displayName.length}/50</p>
      </div>

      {/* ---- Bio ---- */}
      <div className="space-y-1">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-300">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 500))}
          maxLength={500}
          rows={4}
          placeholder="Tell us about yourself..."
          className="w-full resize-none rounded-lg border border-[var(--token-border-muted)] bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={busy}
        />
        <p className="text-right text-xs text-gray-500">{bio.length}/500</p>
      </div>

      {/* ---- Signature ---- */}
      <div className="space-y-1">
        <label htmlFor="signature" className="block text-sm font-medium text-gray-300">
          Signature
        </label>
        <input
          id="signature"
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value.slice(0, 100))}
          maxLength={100}
          placeholder="A short tagline (optional)"
          className="w-full rounded-lg border border-[var(--token-border-muted)] bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={busy}
        />
        <p className="text-right text-xs text-gray-500">{signature.length}/100</p>
      </div>

      {/* ---- Actions ---- */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
            disabled={busy}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || !displayName.trim()}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default ProfileEditForm;
