export const CHAT_BUBBLE_PRESET_IDS = [
  'default',
  'rounded',
  'sharp',
  'cloud',
  'minimal',
  'modern',
  'retro',
  'glass',
  'neon',
  'outline',
  'three-d',
] as const;

export const CHAT_BUBBLE_ANIMATION_IDS = [
  ...CHAT_BUBBLE_PRESET_IDS,
  'pill',
  'asymmetric',
  'aero',
  'flat',
  'compact',
] as const;

export type ChatBubblePresetId = (typeof CHAT_BUBBLE_PRESET_IDS)[number];
export type ChatBubbleAnimationId = (typeof CHAT_BUBBLE_ANIMATION_IDS)[number];
export type ChatBubbleDensity = 'compact' | 'comfortable' | 'spacious';
export type ChatBubbleShape =
  | 'rounded'
  | 'pill'
  | 'sharp'
  | 'organic'
  | 'glass'
  | 'minimal'
  | 'outlined'
  | 'dimensional';

export interface ChatBubblePreset {
  readonly id: ChatBubblePresetId;
  readonly name: string;
  readonly shape: ChatBubbleShape;
  readonly density: ChatBubbleDensity;
  readonly animationId: ChatBubbleAnimationId;
  readonly ownColor: string;
  readonly otherColor: string;
  readonly ownTextColor: string;
  readonly otherTextColor: string;
  readonly borderRadius: number;
  readonly hasGradient: boolean;
  readonly hasTail: boolean;
  readonly shadowIntensity: number;
  readonly glassBlur: number;
}

export type ChatBubbleLegacyStyleId =
  | ChatBubblePresetId
  | 'bubble'
  | 'glassmorphism'
  | '3d'
  | `bubble-${ChatBubbleAnimationId}`
  | 'bubble-3d';

export const CHAT_BUBBLE_STYLE_ALIASES = {
  'bubble-default': 'default',
  'bubble-rounded': 'rounded',
  'bubble-pill': 'rounded',
  'bubble-sharp': 'sharp',
  'bubble-asymmetric': 'sharp',
  'bubble-aero': 'glass',
  'bubble-flat': 'minimal',
  'bubble-compact': 'minimal',
  'bubble-retro': 'retro',
  'bubble-neon': 'neon',
  'bubble-minimal': 'minimal',
  'bubble-cloud': 'cloud',
  'bubble-modern': 'modern',
  'bubble-glass': 'glass',
  'bubble-outline': 'outline',
  'bubble-three-d': 'three-d',
  'bubble-3d': 'three-d',
  bubble: 'rounded',
  glassmorphism: 'glass',
  '3d': 'three-d',
} as const satisfies Readonly<Record<string, ChatBubblePresetId>>;

export const CHAT_BUBBLE_ANIMATION_ALIASES = {
  'bubble-default': 'rounded',
  'bubble-rounded': 'rounded',
  'bubble-pill': 'pill',
  'bubble-sharp': 'sharp',
  'bubble-asymmetric': 'asymmetric',
  'bubble-aero': 'aero',
  'bubble-flat': 'flat',
  'bubble-compact': 'compact',
  'bubble-retro': 'retro',
  'bubble-neon': 'neon',
  'bubble-minimal': 'minimal',
  'bubble-cloud': 'cloud',
  'bubble-modern': 'modern',
  'bubble-glass': 'glass',
  'bubble-outline': 'outline',
  'bubble-three-d': 'three-d',
  'bubble-3d': 'three-d',
  bubble: 'pill',
  glassmorphism: 'glass',
  '3d': 'three-d',
} as const satisfies Readonly<Record<string, ChatBubbleAnimationId>>;

export const chatBubblePresets: readonly ChatBubblePreset[] = [
  {
    id: 'default',
    name: 'Default',
    shape: 'rounded',
    density: 'comfortable',
    animationId: 'default',
    ownColor: '#059669',
    otherColor: '#374151',
    ownTextColor: '#ffffff',
    otherTextColor: '#ffffff',
    borderRadius: 16,
    hasGradient: true,
    hasTail: true,
    shadowIntensity: 20,
    glassBlur: 0,
  },
  {
    id: 'rounded',
    name: 'Rounded',
    shape: 'pill',
    density: 'comfortable',
    animationId: 'rounded',
    ownColor: '#2563eb',
    otherColor: '#334155',
    ownTextColor: '#ffffff',
    otherTextColor: '#ffffff',
    borderRadius: 22,
    hasGradient: true,
    hasTail: true,
    shadowIntensity: 24,
    glassBlur: 0,
  },
  {
    id: 'sharp',
    name: 'Sharp',
    shape: 'sharp',
    density: 'comfortable',
    animationId: 'sharp',
    ownColor: '#0f172a',
    otherColor: '#1f2937',
    ownTextColor: '#ffffff',
    otherTextColor: '#e5e7eb',
    borderRadius: 2,
    hasGradient: false,
    hasTail: false,
    shadowIntensity: 12,
    glassBlur: 0,
  },
  {
    id: 'cloud',
    name: 'Cloud',
    shape: 'organic',
    density: 'spacious',
    animationId: 'cloud',
    ownColor: '#38bdf8',
    otherColor: '#475569',
    ownTextColor: '#06121f',
    otherTextColor: '#ffffff',
    borderRadius: 28,
    hasGradient: true,
    hasTail: false,
    shadowIntensity: 28,
    glassBlur: 6,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    shape: 'minimal',
    density: 'compact',
    animationId: 'minimal',
    ownColor: '#1f2937',
    otherColor: '#111827',
    ownTextColor: '#ffffff',
    otherTextColor: '#d1d5db',
    borderRadius: 4,
    hasGradient: false,
    hasTail: false,
    shadowIntensity: 0,
    glassBlur: 0,
  },
  {
    id: 'modern',
    name: 'Modern',
    shape: 'rounded',
    density: 'comfortable',
    animationId: 'modern',
    ownColor: '#7c3aed',
    otherColor: '#1f2937',
    ownTextColor: '#ffffff',
    otherTextColor: '#ffffff',
    borderRadius: 24,
    hasGradient: false,
    hasTail: false,
    shadowIntensity: 40,
    glassBlur: 15,
  },
  {
    id: 'retro',
    name: 'Retro',
    shape: 'sharp',
    density: 'comfortable',
    animationId: 'retro',
    ownColor: '#f59e0b',
    otherColor: '#1f2937',
    ownTextColor: '#111827',
    otherTextColor: '#fef3c7',
    borderRadius: 6,
    hasGradient: true,
    hasTail: true,
    shadowIntensity: 35,
    glassBlur: 0,
  },
  {
    id: 'glass',
    name: 'Glass',
    shape: 'glass',
    density: 'comfortable',
    animationId: 'glass',
    ownColor: 'rgba(139, 92, 246, 0.3)',
    otherColor: 'rgba(255, 255, 255, 0.05)',
    ownTextColor: '#ffffff',
    otherTextColor: '#e2e8f0',
    borderRadius: 16,
    hasGradient: false,
    hasTail: false,
    shadowIntensity: 50,
    glassBlur: 20,
  },
  {
    id: 'neon',
    name: 'Neon',
    shape: 'rounded',
    density: 'comfortable',
    animationId: 'neon',
    ownColor: '#a3ff12',
    otherColor: '#18181b',
    ownTextColor: '#071006',
    otherTextColor: '#d9f99d',
    borderRadius: 18,
    hasGradient: false,
    hasTail: false,
    shadowIntensity: 60,
    glassBlur: 0,
  },
  {
    id: 'outline',
    name: 'Outline',
    shape: 'outlined',
    density: 'comfortable',
    animationId: 'outline',
    ownColor: 'transparent',
    otherColor: 'transparent',
    ownTextColor: '#ffffff',
    otherTextColor: '#e5e7eb',
    borderRadius: 16,
    hasGradient: false,
    hasTail: false,
    shadowIntensity: 0,
    glassBlur: 0,
  },
  {
    id: 'three-d',
    name: '3D',
    shape: 'dimensional',
    density: 'spacious',
    animationId: 'three-d',
    ownColor: '#4f46e5',
    otherColor: '#312e81',
    ownTextColor: '#ffffff',
    otherTextColor: '#e0e7ff',
    borderRadius: 14,
    hasGradient: true,
    hasTail: true,
    shadowIntensity: 70,
    glassBlur: 0,
  },
] as const;

const chatBubblePresetIdSet = new Set<string>(CHAT_BUBBLE_PRESET_IDS);
const chatBubbleAnimationIdSet = new Set<string>(CHAT_BUBBLE_ANIMATION_IDS);
const chatBubbleStyleAliases = CHAT_BUBBLE_STYLE_ALIASES as Readonly<
  Record<string, ChatBubblePresetId | undefined>
>;
const chatBubbleAnimationAliases = CHAT_BUBBLE_ANIMATION_ALIASES as Readonly<
  Record<string, ChatBubbleAnimationId | undefined>
>;

export const chatBubblePresetsById = Object.fromEntries(
  chatBubblePresets.map((preset) => [preset.id, preset])
) as Readonly<Record<ChatBubblePresetId, ChatBubblePreset>>;

export function isChatBubblePresetId(value: unknown): value is ChatBubblePresetId {
  return typeof value === 'string' && chatBubblePresetIdSet.has(value);
}

export function isChatBubbleAnimationId(value: unknown): value is ChatBubbleAnimationId {
  return typeof value === 'string' && chatBubbleAnimationIdSet.has(value);
}

export function normalizeChatBubbleStyleId(value: unknown): ChatBubblePresetId {
  if (isChatBubblePresetId(value)) return value;
  if (typeof value !== 'string') return 'default';
  return chatBubbleStyleAliases[value] ?? 'default';
}

export function normalizeChatBubbleAnimationId(value: unknown): ChatBubbleAnimationId {
  if (isChatBubbleAnimationId(value)) return value;
  if (typeof value !== 'string') return 'default';
  return chatBubbleAnimationAliases[value] ?? 'default';
}

export function getChatBubblePreset(value: unknown): ChatBubblePreset {
  return chatBubblePresetsById[normalizeChatBubbleStyleId(value)];
}
