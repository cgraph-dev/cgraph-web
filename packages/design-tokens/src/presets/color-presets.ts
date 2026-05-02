export const colorPresets = {
  emerald: { primary: '#10b981', secondary: '#34d399', name: 'Emerald' },
  purple: { primary: '#8b5cf6', secondary: '#a78bfa', name: 'Purple' },
  cyan: { primary: '#06b6d4', secondary: '#22d3ee', name: 'Cyan' },
  orange: { primary: '#f97316', secondary: '#fb923c', name: 'Orange' },
  pink: { primary: '#ec4899', secondary: '#f472b6', name: 'Pink' },
  gold: { primary: '#eab308', secondary: '#facc15', name: 'Gold' },
  crimson: { primary: '#dc2626', secondary: '#f87171', name: 'Crimson' },
  arctic: { primary: '#38bdf8', secondary: '#7dd3fc', name: 'Arctic' },
  sunset: { primary: '#f59e0b', secondary: '#f97316', name: 'Sunset' },
  midnight: { primary: '#4c1d95', secondary: '#6b21a8', name: 'Midnight' },
  forest: { primary: '#059669', secondary: '#10b981', name: 'Forest' },
  ocean: { primary: '#0284c7', secondary: '#0ea5e9', name: 'Ocean' },
} as const;

export type ColorPresetId = keyof typeof colorPresets;
export type ColorPreset = (typeof colorPresets)[ColorPresetId];
