const NAMEPLATE_LOTTIE_MAP: Partial<Record<string, Record<string, unknown>>> = {};

export function getNameplateLottieSource(
  nameplateId: string | null
): Record<string, unknown> | undefined {
  if (!nameplateId || nameplateId === 'plate_none') return undefined;
  return NAMEPLATE_LOTTIE_MAP[nameplateId];
}
