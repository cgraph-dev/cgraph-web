import { useRef, useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { toast } from '@/shared/components/ui';
import { Button } from '@/components/ui/button';
import Card from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { OverviewTabProps } from './types';
import { NodeGatingSection } from './node-gating-section';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { useGroupStore } from '@/modules/groups/store';
import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  GROUP_NAME_MIN_LENGTH,
} from './constants';

const logger = createLogger('OverviewTab');

const MAX_ICON_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_BANNER_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Overview Tab component.
 */
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
      URL.revokeObjectURL(preview);
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
      URL.revokeObjectURL(preview);
      setIsUploadingBanner(false);
    }
  }

  const displayIconUrl = iconPreview ?? group.iconUrl;
  const displayBannerUrl = bannerPreview ?? group.bannerUrl;
  const trimmedNameLength = formData.name.trim().length;
  const nameError =
    trimmedNameLength > 0 && trimmedNameLength < GROUP_NAME_MIN_LENGTH
      ? `Group name must be at least ${GROUP_NAME_MIN_LENGTH} characters.`
      : undefined;

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <p className="cgraph-eyebrow">Group settings</p>
        <h2 className="text-2xl font-semibold text-[var(--token-text-primary)]">Overview</h2>
        <p className="mt-1 text-sm text-[var(--token-text-muted)]">
          Configure your group&apos;s basic settings
        </p>
      </header>

      <Card padding="lg">
        <h3 className="mb-4 font-semibold text-[var(--token-text-primary)]">Group Appearance</h3>

        <input
          ref={bannerInputRef}
          type="file"
          aria-label="Upload group banner"
          accept="image/*"
          className="sr-only"
          onChange={handleBannerChange}
        />
        <input
          ref={iconInputRef}
          type="file"
          aria-label="Upload group icon"
          accept="image/*"
          className="sr-only"
          onChange={handleIconChange}
        />

        <div
          className="cgraph-section-surface relative mb-4 h-32 overflow-hidden"
          data-cgraph-material="recessed"
        >
          {displayBannerUrl ? (
            <img
              src={displayBannerUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PhotoIcon className="h-12 w-12 text-[var(--token-text-disabled)]" />
            </div>
          )}
          {isAdmin && (
            <Button
              variant="glass"
              size="sm"
              leftIcon={<PhotoIcon />}
              onClick={handleBannerClick}
              isLoading={isUploadingBanner}
              animated={false}
              className="absolute bottom-3 right-3"
            >
              Change banner
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="cgraph-empty-icon mb-0 h-20 w-20 overflow-hidden p-0">
            {displayIconUrl ? (
              <img
                src={displayIconUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-2xl font-semibold text-[var(--token-text-primary)]">
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {isAdmin && (
            <div className="min-w-0">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<PhotoIcon />}
                onClick={handleIconClick}
                isLoading={isUploadingIcon}
                animated={false}
              >
                Upload icon
              </Button>
              <p className="mt-1 text-xs text-[var(--token-text-muted)]">
                Recommended: 512x512, max 5MB
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card padding="lg" className="space-y-4">
        <h3 className="font-semibold text-[var(--token-text-primary)]">Basic Information</h3>

        <Input
          id="group-settings-name"
          label="Group name"
          required
          minLength={GROUP_NAME_MIN_LENGTH}
          maxLength={GROUP_NAME_MAX_LENGTH}
          value={formData.name}
          error={nameError}
          hint={`${formData.name.length}/${GROUP_NAME_MAX_LENGTH} characters`}
          onChange={(event) => onChange({ ...formData, name: event.target.value })}
        />

        <Textarea
          id="group-settings-description"
          label="Description"
          rows={4}
          maxLength={GROUP_DESCRIPTION_MAX_LENGTH}
          value={formData.description}
          hint={`${formData.description.length}/${GROUP_DESCRIPTION_MAX_LENGTH} characters`}
          onChange={(event) => onChange({ ...formData, description: event.target.value })}
        />

        <div
          className="cgraph-list-row flex items-center justify-between"
          data-cgraph-material="recessed"
        >
          <div className="min-w-0 pr-4">
            <label
              htmlFor="group-settings-public"
              className="font-medium text-[var(--token-text-primary)]"
            >
              Public group
            </label>
            <p
              id="group-settings-public-description"
              className="text-xs text-[var(--token-text-muted)]"
            >
              Anyone can discover and join
            </p>
          </div>
          <Switch
            id="group-settings-public"
            checked={formData.isPublic}
            onCheckedChange={(isPublic) => onChange({ ...formData, isPublic })}
            className="shrink-0"
          />
        </div>
      </Card>

      <NodeGatingSection group={group} isOwner={isAdmin} />
    </div>
  );
}
