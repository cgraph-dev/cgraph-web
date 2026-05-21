import { ANIMATED_EMOJI_CATALOG, NOTO_CDN } from './animated-emoji-catalog';

let emojiToCodepoint: Map<string, string> | null = null;

function getEmojiMap(): Map<string, string> {
  emojiToCodepoint ??= new Map(ANIMATED_EMOJI_CATALOG.map((entry) => [entry.e, entry.c]));
  return emojiToCodepoint;
}

/** Resolves the animated emoji CDN assets for a supported emoji glyph. */
export function getEmojiAnimationAsset(
  emoji: string
): { lottie: string; webp: string; codepoint: string } | null {
  const codepoint = getEmojiMap().get(emoji);
  if (!codepoint) return null;

  return {
    lottie: `${NOTO_CDN}/${codepoint}/lottie.json`,
    webp: `${NOTO_CDN}/${codepoint}/512.webp`,
    codepoint,
  };
}
