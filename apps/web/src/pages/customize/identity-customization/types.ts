/**
 * Type definitions for IdentityCustomization module
 */

import type { TitleAnimationType } from '@/data/titlesCollection';
import type { RarityTier } from '@cgraph-dev/shared-types';

export type Rarity = RarityTier;

export interface Border {
  id: string;
  name: string;
  rarity: Rarity;
  animation: string;
  colors: string[];
  unlocked: boolean;
  serverItemId?: string;
  serverItemType?: string;
  unlockRequirement?: string;
}

export interface Title {
  id: string;
  name: string;
  animationType: TitleAnimationType;
  gradient: string;
  lottieUrl: string;
  unlocked: boolean;
  serverItemId?: string;
  serverItemType?: string;
  unlockRequirement?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: Rarity;
  unlocked: boolean;
  lottieUrl?: string;
  animationType?: string;
  serverItemId?: string;
  serverItemType?: string;
  unlockRequirement?: string;
}

export interface RarityOption {
  value: Rarity;
  label: string;
  color: string;
}
