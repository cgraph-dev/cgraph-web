
import { motion } from 'motion/react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import VisibilityBadge from '@/modules/settings/components/visibility-badge';
import type { FileUploadState } from './types';

interface AvatarUploadCardProps {
  upload: FileUploadState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancel: () => void;
}

export function AvatarUploadCard({ upload, onChange, onUpload, onCancel }: AvatarUploadCardProps) {
  return (
    <GlassCard className="aurora-social-panel p-6" variant="crystal" glow>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhotoIcon className="h-5 w-5 text-[var(--token-interactive-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--token-text-primary)]">Avatar Image</h3>
        </div>
        <VisibilityBadge visible="others" />
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--token-text-secondary)]">
            Upload New Avatar
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="block w-full cursor-pointer text-sm text-[var(--token-text-muted)] file:mr-4 file:cursor-pointer file:rounded-xl file:border file:border-[var(--token-card-border)] file:bg-[var(--token-bg-secondary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--token-text-primary)] hover:file:bg-[var(--token-card-bg)]"
          />
          <p className="mt-1 text-xs text-[var(--token-text-muted)]">JPG, PNG, or GIF. Max 2MB.</p>
        </div>

        {upload.preview && (
          <div className="flex items-center gap-4">
            <img
              src={upload.preview}
              alt="Avatar preview"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-primary-500"
            />
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onUpload}
                className="aurora-social-button rounded-xl px-4 py-2 text-sm font-medium"
              >
                Upload
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onCancel}
                className="aurora-social-button-muted rounded-xl px-4 py-2 text-sm font-medium"
              >
                Cancel
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
