export interface ThemeProfile {
  readonly id: string;
  readonly name: string;
  readonly themeId: string;
  readonly colorPresetId: string;
  readonly glassmorphism: boolean;
  readonly particles: boolean;
  readonly fontFamily: string;
  readonly backgroundEffect: 'none' | 'gradient' | 'animated';
}

export const themeProfiles: readonly ThemeProfile[] = [
  {
    id: 'minimalist-dark',
    name: 'Minimalist Dark',
    themeId: 'dark',
    colorPresetId: 'emerald',
    glassmorphism: false,
    particles: false,
    fontFamily: 'Inter',
    backgroundEffect: 'none',
  },
  {
    id: 'minimalist-light',
    name: 'Minimalist Light',
    themeId: 'light',
    colorPresetId: 'purple',
    glassmorphism: false,
    particles: false,
    fontFamily: 'Inter',
    backgroundEffect: 'none',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    themeId: 'aurora',
    colorPresetId: 'crimson',
    glassmorphism: true,
    particles: true,
    fontFamily: 'Rajdhani',
    backgroundEffect: 'animated',
  },
  {
    id: 'gradient-aurora',
    name: 'Gradient Aurora',
    themeId: 'aurora',
    colorPresetId: 'purple',
    glassmorphism: true,
    particles: true,
    fontFamily: 'Inter',
    backgroundEffect: 'gradient',
  },
  {
    id: 'gaming-rgb',
    name: 'Gaming RGB',
    themeId: 'bubble',
    colorPresetId: 'crimson',
    glassmorphism: true,
    particles: true,
    fontFamily: 'Orbitron',
    backgroundEffect: 'animated',
  },
] as const;
