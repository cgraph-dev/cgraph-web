
import { motion } from 'motion/react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import VisibilityBadge from '@/modules/settings/components/visibility-badge';
import type { FileUploadState } from './types';

interface BannerUploadCardProps {
  upload: FileUploadState;
  currentBannerUrl?: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancel: () => void;
}

export function BannerUploadCard({
  upload,
  currentBannerUrl,
  onChange,
  onUpload,
  onCancel,
}: BannerUploadCardProps) {
  const displayUrl = upload.preview || currentBannerUrl;

  return (
    <GlassCard className="aurora-social-panel p-6" variant="crystal" glow>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhotoIcon className="h-5 w-5 text-[var(--token-interactive-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--token-text-primary)]">Profile Banner</h3>
        </div>
        <VisibilityBadge visible="others" />
      </div>

      <div className="space-y-4">
        {displayUrl && (
          <div className="h-32 w-full overflow-hidden rounded-lg ring-2 ring-[var(--token-card-border)]">
            <img src={displayUrl} alt="Banner preview" className="h-full w-full object-cover" loading="lazy" />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--token-text-secondary)]">
            Upload New Banner
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="block w-full cursor-pointer text-sm text-[var(--token-text-muted)] file:mr-4 file:cursor-pointer file:rounded-xl file:border file:border-[var(--token-card-border)] file:bg-[var(--token-bg-secondary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--token-text-primary)] hover:file:bg-[var(--token-card-bg)]"
          />
          <p className="mt-1 text-xs text-[var(--token-text-muted)]">
            JPG or PNG. Recommended: 1500x500px. Max 5MB.
          </p>
        </div>

        {upload.file && (
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onUpload}
              className="aurora-social-button rounded-xl px-4 py-2 text-sm font-medium"
            >
              Upload Banner
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onCancel}
              className="aurora-social-button-muted rounded-xl px-4 py-2 text-sm font-medium"
            >
              Cancel
            </motion.button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
