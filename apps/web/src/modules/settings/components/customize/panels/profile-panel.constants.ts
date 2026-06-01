/**
 * Profile customization panel constants.
 */
import { PROFILE_CARD_LAYOUTS } from '@cgraph-dev/shared-types';
import type { ProfileCardStyle } from '@/modules/settings/store/customization';

const PROFILE_CARD_STYLE_ICONS: Record<ProfileCardStyle, string> = {
  default: '📋',
  minimal: '✨',
  card: '🎴',
  full: '📐',
  compact: '📦',
  premium: '👑',
};

export const profileStyles = PROFILE_CARD_LAYOUTS.map((layout) => ({
  id: layout.id,
  name: layout.name,
  icon: PROFILE_CARD_STYLE_ICONS[layout.id],
  premium: layout.premium || undefined,
})) satisfies {
  id: ProfileCardStyle;
  name: string;
  icon: string;
  premium?: boolean;
}[];
