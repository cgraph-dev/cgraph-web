/**
 * Color Tab Component
 *
 * Color preset selection with visual swatches.
 */

import { motion } from 'motion/react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { THEME_COLORS, type ThemeColorPreset } from '@/stores';

import type { ColorTabProps } from './types';
import { FADE_UP } from '@/lib/animations/transitions';

function isThemeColorPreset(value: string): value is ThemeColorPreset {
  return value in THEME_COLORS;
}

function getThemeColorEntries(): Array<{
  preset: ThemeColorPreset;
  config: (typeof THEME_COLORS)[ThemeColorPreset];
}> {
  return Object.keys(THEME_COLORS).flatMap((preset) => {
    if (!isThemeColorPreset(preset)) {
      return [];
    }

    return [{ preset, config: THEME_COLORS[preset] }];
  });
}

// COMPONENT

export function ColorTab({ selectedColor, onSelectColor }: ColorTabProps) {
  const colors = getThemeColorEntries();

  return (
    <motion.div
      {...FADE_UP}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3 className="mb-4 text-lg font-semibold text-white">Color Presets</h3>
      <p className="mb-6 text-sm text-gray-400">Choose a color theme that represents your style</p>

      <div className="grid grid-cols-4 gap-4">
        {colors.map(({ preset, config }) => (
          <motion.button
            key={preset}
            whileTap={{ scale: 0.88 }}
            onClick={() => onSelectColor(preset)}
            className={`relative rounded-xl p-4 transition-all ${
              selectedColor === preset
                ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800'
                : 'hover:bg-[var(--token-card-bg)]'
            }`}
          >
            <div
              className="mb-2 aspect-square w-full rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${config.primary}, ${config.secondary})`,
                boxShadow: `0 4px 20px ${config.glow}`,
              }}
            />
            <span className="text-sm font-medium text-gray-300">{config.name}</span>
            {selectedColor === preset && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white"
              >
                <CheckIcon className="h-3 w-3 text-dark-900" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default ColorTab;
