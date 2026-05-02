/**
 * AvatarPreviewCard component
 * Shows live preview with the user's equipped Lottie border from customization store.
 */

import { SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';

interface AvatarPreviewCardProps {
  avatarUrl?: string | null;
  displayName?: string;
}

/**
 * Avatar Preview Card — shows the user's avatar with their equipped Lottie border.
 */
export function AvatarPreviewCard({ avatarUrl, displayName }: AvatarPreviewCardProps) {
  const selectedBorderId = useCustomizationStore((s) => s.selectedBorderId);

  return (
    <GlassCard className="p-8" variant="frosted">
      <div className="flex flex-col items-center gap-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <SparklesIcon className="h-5 w-5 text-primary-400" />
          Live Preview
        </h3>
        <ThemedAvatar
          src={avatarUrl}
          alt={displayName || 'User'}
          size="xlarge"
          avatarBorderId={selectedBorderId}
        />
        <p className="text-sm text-gray-400">Your avatar with current border</p>
      </div>
    </GlassCard>
  );
}
