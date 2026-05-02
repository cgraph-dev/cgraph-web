/**
 * AccentColorPicker — hex color selector with preset swatches and custom input.
 *
 * Provides 12 curated preset swatches (brand-aligned with CGraph rarity tiers
 * and neutral tones) plus a custom hex entry field with #RRGGBB validation.
 * A gradient preview panel shows how the selected accent looks.
 *
 */

import { useState, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
// Constants
const PRESET_SWATCHES = [
  '#9ca3af',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#0d0d0d',
  '#f8fafc',
  '#1e293b',
] as const;

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
// Props
interface AccentColorPickerProps {
  /** Currently selected accent color (null = none). */
  readonly currentColor: string | null;
  /** Called when the user selects or enters a valid color. */
  readonly onChange: (hex: string) => void;
}
// Component
/** Accent Color Picker. */
export function AccentColorPicker({ currentColor, onChange }: AccentColorPickerProps) {
  const [customHex, setCustomHex] = useState(currentColor ?? '');
  const [isCustomValid, setIsCustomValid] = useState(true);

  const handleSwatchClick = (hex: string) => {
    setCustomHex(hex);
    setIsCustomValid(true);
    onChange(hex);
  };

  const handleCustomChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Auto-prefix # if user omitted it
    if (value.length > 0 && !value.startsWith('#')) {
      value = `#${value}`;
    }

    setCustomHex(value);

    if (HEX_REGEX.test(value)) {
      setIsCustomValid(true);
      onChange(value);
    } else {
      setIsCustomValid(value.length === 0);
    }
  };

  const activeColor = currentColor ?? '#3b82f6';

  return (
    <div className="flex flex-col gap-4">
      {/* Section label */}
      <h3 className="text-sm font-semibold text-white">Accent Color</h3>

      {/* Preset swatches */}
      <div className="grid grid-cols-6 gap-2">
        {PRESET_SWATCHES.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => handleSwatchClick(hex)}
            className="group relative flex aspect-square items-center justify-center rounded-lg border transition-all hover:scale-105"
            style={{
              backgroundColor: hex,
              borderColor: currentColor === hex ? 'white' : 'transparent',
            }}
            aria-label={`Select color ${hex}`}
          >
            {currentColor === hex && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-white/90"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="#000"
                  className="h-3 w-3"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
            )}
          </button>
        ))}
      </div>

      {/* Custom hex input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="custom-hex" className="text-xs text-gray-400">
          Custom hex
        </label>
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 shrink-0 rounded-lg border border-[var(--token-border-muted)]"
            style={{ backgroundColor: HEX_REGEX.test(customHex) ? customHex : '#000' }}
          />
          <input
            id="custom-hex"
            type="text"
            value={customHex}
            onChange={handleCustomChange}
            placeholder="#3b82f6"
            maxLength={7}
            className={`h-9 flex-1 rounded-lg border bg-white/5 px-3 text-sm text-white placeholder-gray-500 outline-none transition-colors ${
              isCustomValid
                ? 'border-[var(--token-border-muted)] focus:border-cyan-500/50'
                : 'border-red-500/50'
            }`}
          />
        </div>
        {!isCustomValid && (
          <p className="text-xs text-red-400">Enter a valid hex color (#RRGGBB)</p>
        )}
      </div>

      {/* Gradient preview */}
      <div className="overflow-hidden rounded-xl border border-[var(--token-border-muted)]">
        <div
          className="h-16 w-full"
          style={{
            background: `linear-gradient(135deg, ${activeColor}, ${activeColor}40, transparent)`,
          }}
        />
        <div className="flex items-center gap-3 bg-[var(--token-bg-primary)] px-4 py-3">
          <div className="h-8 w-8 rounded-full" style={{ backgroundColor: activeColor }} />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">Preview</span>
            <span className="text-xs text-gray-400">{activeColor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
