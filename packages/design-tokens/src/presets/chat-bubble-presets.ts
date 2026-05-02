export interface ChatBubblePreset {
  readonly id: string;
  readonly name: string;
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

export const chatBubblePresets: readonly ChatBubblePreset[] = [
  {
    id: 'default',
    name: 'Default',
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
    id: 'minimal',
    name: 'Minimal',
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
    id: 'glass',
    name: 'Glass',
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
] as const;
