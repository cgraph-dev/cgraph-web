/**
 * Display Options Section
 *
 * Font size, message spacing, and display mode settings.
 */

import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

import { SectionHeader } from './section-header';
import { Slider } from './slider';

// TYPES

interface DisplayOptionsProps {
  /** Current font scale */
  fontScale: number;
  /** Current message spacing */
  messageSpacing: number;
  /** Current message display mode */
  messageDisplay: 'cozy' | 'compact';
  /** Callback to set font scale */
  setFontScale: (value: number) => void;
  /** Callback to set message spacing */
  setMessageSpacing: (value: number) => void;
  /** Callback to set message display mode */
  setMessageDisplay: (mode: 'cozy' | 'compact') => void;
}

// COMPONENT

/**
 */
/**
 * Display Options component.
 */
export function DisplayOptions({
  fontScale,
  messageSpacing,
  messageDisplay,
  setFontScale,
  setMessageSpacing,
  setMessageDisplay,
}: DisplayOptionsProps) {
  return (
    <section>
      <SectionHeader
        icon={<AdjustmentsHorizontalIcon className="h-5 w-5" />}
        title="Display"
        description="Adjust text size and message density"
      />

      <div className="aurora-social-panel space-y-6 rounded-2xl p-6">
        <Slider
          value={fontScale}
          min={0.8}
          max={1.4}
          step={0.1}
          onChange={setFontScale}
          label="Font Size"
          displayValue={`${Math.round(fontScale * 100)}%`}
        />

        <Slider
          value={messageSpacing}
          min={0.5}
          max={2}
          step={0.1}
          onChange={setMessageSpacing}
          label="Message Spacing"
          displayValue={`${Math.round(messageSpacing * 100)}%`}
        />

        <div>
          <label className="mb-3 block text-sm font-medium text-[var(--token-text-secondary)]">
            Message Display
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['cozy', 'compact'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMessageDisplay(mode)}
                className={`${
                  messageDisplay === mode
                    ? 'aurora-social-button text-[var(--token-text-primary)]'
                    : 'aurora-social-option text-[var(--token-text-secondary)]'
                } rounded-2xl p-4 transition-all`}
              >
                <div className="flex flex-col items-center gap-2">
                  {mode === 'cozy' ? (
                    <div className="w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary-500" />
                        <div className="flex-1">
                          <div className="h-2 w-16 rounded bg-[var(--token-border-primary)]" />
                          <div className="mt-1 h-1.5 w-24 rounded bg-[var(--token-bg-tertiary)]" />
                        </div>
                      </div>
                      <div className="ml-8 h-3 rounded bg-[var(--token-bg-tertiary)]" />
                    </div>
                  ) : (
                    <div className="w-full space-y-1">
                      <div className="flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full bg-primary-500" />
                        <div className="h-2 w-12 rounded bg-[var(--token-border-primary)]" />
                        <div className="h-2 flex-1 rounded bg-[var(--token-bg-tertiary)]" />
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="bg-primary-400/80 h-4 w-4 rounded-full" />
                        <div className="h-2 w-10 rounded bg-[var(--token-border-primary)]" />
                        <div className="h-2 flex-1 rounded bg-[var(--token-bg-tertiary)]" />
                      </div>
                    </div>
                  )}
                  <span className="text-sm font-medium capitalize text-[var(--token-text-primary)]">
                    {mode}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default DisplayOptions;
