// Re-export from shared package for backward compatibility
export {
  TITLES,
  TITLE_RARITY_COLORS as RARITY_COLORS,
  getTitleById,
  getTitlesByCategory,
  getTitlesByRarity,
  getPurchasableTitles,
  getAchievementTitles,
  type Title,
  type TitleRarity,
  type TitleCategory,
  type TitleAnimation,
  type TitleAnimationType,
} from '@cgraph-dev/animation-constants';
