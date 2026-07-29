import {
  Badge,
  Frame,
  Image,
  MessageSquare,
  Palette,
  Shield,
  Sparkles,
  Tag,
  Type,
  type LucideIcon,
} from 'lucide-react';
import type { CosmeticType } from '@cgraph-dev/shared-types';

const ICONS: Partial<Record<CosmeticType, LucideIcon>> = {
  avatar_border: Shield,
  border: Shield,
  animated_border: Shield,
  avatar_frame: Frame,
  profile_frame: Frame,
  badge: Badge,
  nameplate: Image,
  title: Tag,
  name_style: Type,
  chat_bubble: MessageSquare,
  chat_effect: Sparkles,
  profile_effect: Sparkles,
  theme: Palette,
  profile_theme: Palette,
};

interface CosmeticTypeIconProps {
  readonly type: CosmeticType;
  readonly className?: string;
}

export function CosmeticTypeIcon({ type, className }: CosmeticTypeIconProps) {
  const Icon = ICONS[type] ?? Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}
