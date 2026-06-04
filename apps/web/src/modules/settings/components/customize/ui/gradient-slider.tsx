/**
 * Gradient slider component with range input
 */

import { memo } from 'react';

import { THEME_COLORS as themeColors } from '@/stores/theme';

import type { GradientSliderProps } from './types';

export const GradientSlider = memo(function GradientSlider({
  value,
  min,
  max,
  onChange,
  colorPreset = 'purple',
  label,
  showValue = true,
  suffix = '',
}: GradientSliderProps) {
  const colors = themeColors[colorPreset];
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between">
          {label && <span className="text-sm text-white/60">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-[var(--token-text-primary)]">
              {value}
              {suffix}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
          style={{
            background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
          }}
        />
        <style>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${colors.secondary};
            cursor: pointer;
            border: 2px solid rgba(15, 18, 30, 0.9);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), 0 0 0 1px ${colors.primary}40;
          }
          input[type='range']::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${colors.secondary};
            cursor: pointer;
            border: 2px solid rgba(15, 18, 30, 0.9);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), 0 0 0 1px ${colors.primary}40;
          }
        `}</style>
      </div>
    </div>
  );
});
