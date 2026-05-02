import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { toast } from '@/shared/components/ui';
import type { OverviewTabProps } from './types';
import { FADE_UP } from '@/lib/animations/transitions';
import { NodeGatingSection } from './node-gating-section';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { useGroupStore } from '@/modules/groups/store';

const logger = createLogger('OverviewTab');

const MAX_ICON_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_BANNER_SIZE = 10 * 1024 * 1024; // 10 MB

export function OverviewTab({ group, formData, onChange, isAdmin }: OverviewTabProps) {
  const iconInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const updateGroup = useGroupStore((s) => s.updateGroup);

  function handleIconClick() {
    iconInputRef.current?.click();
  }

  function handleBannerClick() {
    bannerInputRef.current?.click();
  }

  async function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > MAX_ICON_SIZE) {
      toast.error('Icon must be less than 5MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setIconPreview(preview);
    setIsUploadingIcon(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await http.post(`/api/v1/groups/${group.id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl: string = res.data.url;
      await updateGroup(group.id, { iconUrl: uploadedUrl });
      setIconPreview(uploadedUrl);
      toast.success('Group icon updated successfully!');
    } catch (err) {
      logger.error('Failed to upload group icon:', err);
      toast.error('Failed to upload icon. Please try again.');
      setIconPreview(null);
    } finally {
      setIsUploadingIcon(false);
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > MAX_BANNER_SIZE) {
      toast.error('Banner must be less than 10MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setBannerPreview(preview);
    setIsUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await http.post(`/api/v1/groups/${group.id}/banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl: string = res.data.url;
      await updateGroup(group.id, { bannerUrl: uploadedUrl });
      setBannerPreview(uploadedUrl);
      toast.success('Group banner updated successfully!');
    } catch (err) {
      logger.error('Failed to upload group banner:', err);
      toast.error('Failed to upload banner. Please try again.');
      setBannerPreview(null);
    } finally {
      setIsUploadingBanner(false);
    }
  }

  const displayIconUrl = iconPreview ?? group.iconUrl;
  const displayBannerUrl = bannerPreview ?? group.bannerUrl;

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} className="max-w-2xl space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Overview</h2>
        <p className="text-gray-400">Configure your group's basic settings</p>
      </div>

      {/* Banner & Icon */}
      <GlassCard variant="frosted" className="p-6">
        <h3 className="mb-4 font-semibold text-white">Group Appearance</h3>

        {/* Hidden file inputs */}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleBannerChange}
        />
        <input
          ref={iconInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleIconChange}
        />

        {/* Banner */}
        <div className="relative mb-4 h-32 overflow-hidden rounded-xl bg-[var(--token-card-bg)/0.6]">
          {displayBannerUrl ? (
            <img
              src={displayBannerUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PhotoIcon className="h-12 w-12 text-gray-600" />
            </div>
          )}
          {isAdmin && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleBannerClick}
              disabled={isUploadingBanner}
              className="bg-[var(--token-bg-secondary)]/80 hover:bg-[var(--token-bg-tertiary)]/90 absolute bottom-3 right-3 flex items-center gap-2 rounded-xl border border-[var(--token-card-border)] px-4 py-2 text-[13px] font-bold text-white shadow-lg backdrop-blur-md transition-all hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PhotoIcon className="h-4 w-4" />
              {isUploadingBanner ? 'Uploading…' : 'Change Banner'}
            </motion.button>
          )}
        </div>

        {/* Icon */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-2xl bg-[var(--token-card-bg)/0.6]">
            {displayIconUrl ? (
              <img
                src={displayIconUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="text-2xl font-bold text-white">
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {isAdmin && (
            <div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={handleIconClick}
                disabled={isUploadingIcon}
                className="rounded-xl border border-[color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-purple)_10%,transparent)] px-5 py-2.5 text-[13px] font-bold text-[var(--color-brand-purple)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all hover:bg-[color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploadingIcon ? 'Uploading…' : 'Upload Icon'}
              </motion.button>
              <p className="mt-1 text-xs text-gray-500">Recommended: 512x512 · Max 5MB</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Basic Info */}
      <GlassCard variant="frosted" className="space-y-4 p-6">
        <h3 className="font-semibold text-white">Basic Information</h3>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Group Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full resize-none rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-[var(--token-card-bg)/0.4] p-4">
          <div>
            <span className="font-medium text-white">Public Group</span>
            <p className="text-xs text-gray-400">Anyone can discover and join</p>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange({ ...formData, isPublic: !formData.isPublic })}
            className={`h-6 w-12 rounded-full transition-colors ${
              formData.isPublic ? 'bg-primary-600' : 'bg-[var(--token-card-bg)]'
            }`}
          >
            <motion.div
              animate={{ x: formData.isPublic ? 24 : 0 }}
              className="h-6 w-6 rounded-full bg-white shadow-lg"
            />
          </motion.button>
        </div>
      </GlassCard>

      {/* Node Gating */}
      <NodeGatingSection group={group} isOwner={isAdmin} />
    </motion.div>
  );
}
