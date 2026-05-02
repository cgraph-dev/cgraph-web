/**
 * VanishTimerPicker — Signal-exact 8-preset vanish message timer selector.
 *
 * Displays horizontal pill buttons for each of Signal's DEFAULT_DURATIONS_IN_SECONDS.
 * Keyboard navigable with arrow keys. Used in chat info panel.
 */

import { useRef } from 'react';
import { motion } from 'motion/react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { springs } from '@/lib/animation-presets';
import { VANISH_TIMER_PRESETS } from '@cgraph/shared-types';

interface VanishTimerPickerProps {
  /** Current timer value in seconds (0 or null = off). */
  currentValue: number | null;
  /** Called when user selects a new duration. */
  onChange: (seconds: number) => void;
  /** Whether the picker is disabled. */
  disabled?: boolean;
}

/**
 * Vanish timer picker with Signal's 8 exact preset durations.
 * Renders as a horizontal row of pill buttons.
 */
export function VanishTimerPicker({
  currentValue,
  onChange,
  disabled = false,
}: VanishTimerPickerProps): React.ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedValue = currentValue ?? 0;

  /** Handle keyboard navigation between pills. */
  function handleKeyDown(e: React.KeyboardEvent, index: number): void {
    const items = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    if (!items) return;

    let nextIndex = index;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % items.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const preset = VANISH_TIMER_PRESETS[index];
      if (preset) onChange(preset.value);
      return;
    }

    if (nextIndex !== index) {
      const nextItem = items[nextIndex];
      if (nextItem) nextItem.focus();
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <ClockIcon className="h-4 w-4" />
        <span>Vanish Messages</span>
        {selectedValue > 0 && (
          <span className="ml-auto text-xs text-primary-400">
            {VANISH_TIMER_PRESETS.find((p) => p.value === selectedValue)?.label ?? 'Off'}
          </span>
        )}
      </div>

      {/* Pill buttons */}
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label="Vanish message timer"
        className="flex flex-wrap gap-2"
      >
        {VANISH_TIMER_PRESETS.map((preset, index) => {
          const isSelected = preset.value === selectedValue;

          return (
            <motion.button
              key={preset.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={preset.label}
              tabIndex={isSelected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(preset.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-[rgb(30,32,40)] disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/15'
              }`}
              whileTap={disabled ? undefined : { scale: 0.92 }}
              layout
              transition={springs.gentle}
            >
              {preset.shortLabel}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
