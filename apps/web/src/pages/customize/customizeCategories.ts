/**
 * Customization page category definitions.
 */
import {
  UserCircleIcon,
  PaintBrushIcon,
  ArchiveBoxIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export type CategoryId = 'identity' | 'themes' | 'bubbles' | 'effects' | 'inventory' | 'shop';

export interface Category {
  id: CategoryId;
  label: string;
  icon: typeof UserCircleIcon;
  description: string;
  gradient: string;
  features: string[];
}

export const categories: Category[] = [
  {
    id: 'identity',
    label: 'Identity',
    icon: UserCircleIcon,
    description: 'Avatar borders, titles & badges',
    gradient: 'from-[var(--token-interactive-primary)]/10 to-[var(--token-interactive-primary)]/5',
    features: ['44 Borders', '26 Titles', 'Badges'],
  },
  {
    id: 'themes',
    label: 'Themes',
    icon: PaintBrushIcon,
    description: 'Profile, chat, forum & app themes',
    gradient: 'from-[var(--token-interactive-primary)]/10 to-[var(--token-interactive-primary)]/5',
    features: ['3 Themes', 'Custom Colors', 'Presets'],
  },
  {
    id: 'bubbles',
    label: 'Chat Bubbles',
    icon: ChatBubbleLeftRightIcon,
    description: 'Bubble style, colour, radius, shadow, glass',
    gradient: 'from-[var(--token-interactive-primary)]/10 to-[var(--token-interactive-primary)]/5',
    features: ['8 Styles', '12 Colours', 'Glass Effect'],
  },
  {
    id: 'effects',
    label: 'Effects',
    icon: SparklesIcon,
    description: 'Visual effect preset, animation speed, particles',
    gradient: 'from-[var(--token-interactive-primary)]/10 to-[var(--token-interactive-primary)]/5',
    features: ['6 Presets', 'Animation Speed', 'Particles'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: ArchiveBoxIcon,
    description: 'Browse your owned cosmetic items',
    gradient: 'from-[var(--token-interactive-primary)]/10 to-[var(--token-interactive-primary)]/5',
    features: ['Permanent', 'Subscription', 'Gifts & Rewards'],
  },
  {
    id: 'shop',
    label: 'Shop',
    icon: ShoppingBagIcon,
    description: 'Discover and purchase cosmetics',
    gradient: 'from-[var(--token-interactive-primary)]/10 to-[var(--token-interactive-primary)]/5',
    features: ['Badges', 'Borders', 'Themes & More'],
  },
];
