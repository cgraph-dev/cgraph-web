/**
 * ProfileInfoCard component
 */

import { motion } from 'motion/react';
import {
  UserCircleIcon,
  GlobeAltIcon,
  MapPinIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import VisibilityBadge from '@/modules/settings/components/visibility-badge';
import type { AvatarSettingsFormData } from './types';
import { MAX_BIO_LENGTH, MAX_LOCATION_LENGTH, MAX_OCCUPATION_LENGTH } from './constants';

interface ProfileInfoCardProps {
  formData: AvatarSettingsFormData;
  onChange: (data: AvatarSettingsFormData) => void;
  onSave: () => void;
}

/**
 */
/**
 * Profile Info Card display component.
 */
export function ProfileInfoCard({ formData, onChange, onSave }: ProfileInfoCardProps) {
  return (
    <GlassCard className="aurora-social-panel p-6" variant="holographic" glow>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="h-5 w-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-white">Profile Information</h3>
        </div>
        <VisibilityBadge visible="others" />
      </div>

      <div className="space-y-4">
        {/* Bio */}
        <div>
          <label className="mb-2 block text-sm font-medium text-white/60">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => onChange({ ...formData, bio: e.target.value })}
            placeholder="Tell others about yourself..."
            maxLength={MAX_BIO_LENGTH}
            rows={4}
            className="aurora-social-select w-full resize-none rounded-xl px-4 py-3 text-white placeholder-white/30"
          />
          <p className="mt-1 text-xs text-white/40">
            {formData.bio.length}/{MAX_BIO_LENGTH} characters
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
            <MapPinIcon className="h-4 w-4" />
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => onChange({ ...formData, location: e.target.value })}
            placeholder="City, Country"
            maxLength={MAX_LOCATION_LENGTH}
            className="aurora-social-select w-full rounded-xl px-4 py-3 text-white placeholder-white/30"
          />
        </div>

        {/* Website */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
            <GlobeAltIcon className="h-4 w-4" />
            Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => onChange({ ...formData, website: e.target.value })}
            placeholder="https://yourwebsite.com"
            className="aurora-social-select w-full rounded-xl px-4 py-3 text-white placeholder-white/30"
          />
        </div>

        {/* Occupation */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/60">
            <BriefcaseIcon className="h-4 w-4" />
            Occupation
          </label>
          <input
            type="text"
            value={formData.occupation}
            onChange={(e) => onChange({ ...formData, occupation: e.target.value })}
            placeholder="Your profession or role"
            maxLength={MAX_OCCUPATION_LENGTH}
            className="aurora-social-select w-full rounded-xl px-4 py-3 text-white placeholder-white/30"
          />
        </div>

        {/* Save Profile Button */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            onSave();
            HapticFeedback.success();
          }}
          className="aurora-social-button w-full rounded-xl px-6 py-3 font-medium text-white"
        >
          Save Profile Information
        </motion.button>
      </div>
    </GlassCard>
  );
}
