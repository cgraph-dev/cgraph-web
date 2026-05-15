/**
 * Calls settings panel.
 *
 * Lets the user pick voice/video defaults applied at the next call
 * start. Active call sessions remain owned by `voiceStateStore`; this
 * panel only configures the defaults.
 *
 * Server-synced through the settings store.
 */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { useSettingsStore } from '@/modules/settings/store';
import type { VideoResolution } from '@/modules/settings/store';
import { FADE_UP } from '@/lib/animations/transitions';

interface ResolutionOption {
  readonly value: VideoResolution;
  readonly label: string;
  readonly description: string;
}

const RESOLUTIONS: readonly ResolutionOption[] = [
  { value: 'auto', label: 'Auto', description: 'Adjust based on available bandwidth' },
  { value: '720p', label: '720p', description: 'Standard HD — saves bandwidth' },
  { value: '1080p', label: '1080p', description: 'Full HD — best quality on fast networks' },
];

/**
 * Calls settings panel component.
 */
export function CallsSettingsPanel(): ReactNode {
  const calls = useSettingsStore((s) => s.settings.calls);
  const updateCalls = useSettingsStore((s) => s.updateCallsSettings);

  return (
    <motion.div {...FADE_UP} className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-[var(--token-card-bg)] p-2">
          <PhoneIcon className="h-5 w-5 text-[var(--token-interactive-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--token-text-primary)]">Calls</h1>
          <p className="text-sm text-[var(--token-text-secondary)]">
            Microphone processing and default video quality
          </p>
        </div>
      </header>

      <GlassCard variant="frosted" className="p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--token-text-primary)]">
          Microphone
        </h2>
        <ToggleRow
          label="Echo cancellation"
          description="Suppress room echo and feedback."
          checked={calls.echoCancellation}
          onChange={(v) => updateCalls({ echoCancellation: v })}
        />
        <ToggleRow
          label="Noise suppression"
          description="Filter steady background noise."
          checked={calls.noiseSuppression}
          onChange={(v) => updateCalls({ noiseSuppression: v })}
        />
        <ToggleRow
          label="Auto gain control"
          description="Even out microphone volume automatically."
          checked={calls.autoGainControl}
          onChange={(v) => updateCalls({ autoGainControl: v })}
        />
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--token-text-primary)]">
          Default video resolution
        </h2>
        <div className="space-y-2">
          {RESOLUTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateCalls({ defaultVideoResolution: option.value })}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                calls.defaultVideoResolution === option.value
                  ? 'bg-[var(--token-interactive-primary)]/10 border-[var(--token-interactive-primary)]'
                  : 'border-[var(--token-border-subtle)] hover:border-[var(--token-border-hover)]'
              }`}
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-[var(--token-text-primary)]">
                  {option.label}
                </div>
                <div className="text-xs text-[var(--token-text-muted)]">{option.description}</div>
              </div>
              {calls.defaultVideoResolution === option.value && (
                <span
                  aria-hidden="true"
                  className="mt-1 h-2 w-2 rounded-full bg-[var(--token-interactive-primary)]"
                />
              )}
            </button>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

interface ToggleRowProps {
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onChange: (next: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps): ReactNode {
  return (
    <label className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <div className="text-sm font-medium text-[var(--token-text-primary)]">{label}</div>
        <div className="text-xs text-[var(--token-text-muted)]">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 cursor-pointer accent-[var(--token-interactive-primary)]"
      />
    </label>
  );
}
