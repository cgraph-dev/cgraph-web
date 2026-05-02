/**
 * IdentityCustomization Module
 *
 * Streamlined identity customization page with 5 sections:
 * 1. Avatar Borders - 150+ animated borders with search/rarity filtering
 * 2. Titles - 30+ animated title styles
 * 3. Badges - 40+ badges, equip up to 5
 * 4. Name Styles - Typography and effect customization for username
 * 5. Nameplates - Multi-context username background styles
 */

export { default } from './identity-customization';

// Types
export type { Rarity, Border, Title, Badge, RarityOption } from './types';

// Constants (data now fetched from API)
export { RARITIES, getRarityColor, getV2BorderType } from './constants';

// Section Components
export {
  BordersSection,
  TitlesSection,
  BadgesSection,
  NameStylesSection,
  NameplatesSection,
} from './sections';
