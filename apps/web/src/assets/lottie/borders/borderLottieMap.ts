/**
 * Border Lottie Animation Map
 *
 * Maps theme+rarity combinations to their Lottie animation JSON URLs
 * served from the public directory. Loaded on-demand, not bundled.
 */

const BASE = '/lottie/borders';

/**
 * Lookup key: `${theme}_${rarity}`
 * Returns the public URL for that Lottie JSON file.
 */
export const BORDER_LOTTIE_MAP: Record<string, string> = {
  // 8-Bit
  '8bit_free': `${BASE}/8bit_free_01.json`,
  '8bit_epic': `${BASE}/8bit_epic_01.json`,

  // Anime
  anime_rare: `${BASE}/anime_rare_01.json`,

  // Cosmic
  cosmic_common: `${BASE}/cosmic_common_01.json`,
  cosmic_legendary: `${BASE}/cosmic_legendary_01.json`,

  // Cyberpunk
  cyberpunk_common: `${BASE}/cyberpunk_common_01.json`,
  cyberpunk_rare: `${BASE}/cyberpunk_rare_01.json`,
  cyberpunk_epic: `${BASE}/cyberpunk_epic_01.json`,
  cyberpunk_mythic: `${BASE}/purple-demonic-border--horns-subtle-throb-glow--da.json`,

  // Kawaii
  kawaii_free: `${BASE}/kawaii_free_01.json`,

  // Special animated borders (real Lottie animations)
  special_avatar_frame: `${BASE}/avatar-frame.json`,
  avatar_frame: `${BASE}/avatar-frame.json`,
};

/**
 * Get the Lottie URL for a border by its theme and rarity.
 * Returns undefined if no dedicated Lottie animation exists for this combo.
 */
export function getBorderLottieUrl(theme: string, rarity: string): string | undefined {
  return BORDER_LOTTIE_MAP[`${theme}_${rarity}`];
}
