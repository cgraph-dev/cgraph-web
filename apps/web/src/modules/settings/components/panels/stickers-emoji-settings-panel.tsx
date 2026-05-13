/**
 * Stickers & Emoji settings panel.
 *
 * Mirrors Telegram-iOS `InstalledStickerPacksController.swift` — toggle
 * sticker suggestions, animated-sticker looping, default emoji skin
 * tone, plus a list of installed sticker packs with remove buttons.
 *
 * Local-only (no backend sync); preferences live in the persisted
 * Zustand settings store.
 */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { FaceSmileIcon, TrashIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { useSettingsStore } from '@/modules/settings/store';
import type { EmojiSkinTone } from '@/modules/settings/store';
import { FADE_UP } from '@/lib/animations/transitions';

interface SkinToneOption {
  readonly value: EmojiSkinTone;
  readonly label: string;
  readonly emoji: string;
}

const SKIN_TONES: readonly SkinToneOption[] = [
  { value: 'neutral', label: 'Neutral', emoji: '👋' },
  { value: 'light', label: 'Light', emoji: '👋🏻' },
  { value: 'medium-light', label: 'Medium-light', emoji: '👋🏼' },
  { value: 'medium', label: 'Medium', emoji: '👋🏽' },
  { value: 'medium-dark', label: 'Medium-dark', emoji: '👋🏾' },
  { value: 'dark', label: 'Dark', emoji: '👋🏿' },
];

/**
 * Stickers & Emoji settings panel component.
 */
export function StickersEmojiSettingsPanel(): ReactNode {
  const stickersEmoji = useSettingsStore((s) => s.settings.stickersEmoji);
  const updateStickersEmoji = useSettingsStore((s) => s.updateStickersEmojiSettings);
  const removePack = useSettingsStore((s) => s.removeInstalledStickerPack);

  return (
    <motion.div {...FADE_UP} className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-[var(--token-card-bg)] p-2">
          <FaceSmileIcon className="h-5 w-5 text-[var(--token-interactive-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--token-text-primary)]">
            Stickers & Emoji
          </h1>
          <p className="text-sm text-[var(--token-text-secondary)]">
            Suggestions, animated playback, and default skin tone
          </p>
        </div>
      </header>

      <GlassCard variant="frosted" className="p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--token-text-primary)]">
          Suggestions
        </h2>
        <ToggleRow
          label="Suggest stickers"
          description="Show matching stickers as you type."
          checked={stickersEmoji.suggestStickers}
          onChange={(v) => updateStickersEmoji({ suggestStickers: v })}
        />
        <ToggleRow
          label="Loop animated stickers"
          description="Play animated stickers and emoji on repeat."
          checked={stickersEmoji.loopAnimatedStickers}
          onChange={(v) => updateStickersEmoji({ loopAnimatedStickers: v })}
        />
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--token-text-primary)]">
          Default skin tone
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {SKIN_TONES.map((tone) => (
            <button
              key={tone.value}
              type="button"
              onClick={() => updateStickersEmoji({ defaultSkinTone: tone.value })}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                stickersEmoji.defaultSkinTone === tone.value
                  ? 'bg-[var(--token-interactive-primary)]/10 border-[var(--token-interactive-primary)] text-[var(--token-text-primary)]'
                  : 'border-[var(--token-border-subtle)] text-[var(--token-text-secondary)] hover:border-[var(--token-border-hover)]'
              }`}
            >
              <span className="text-base">{tone.emoji}</span>
              <span>{tone.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard variant="frosted" className="p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--token-text-primary)]">
          Installed sticker packs
        </h2>
        {stickersEmoji.installedPackIds.length === 0 ? (
          <p className="text-sm text-[var(--token-text-muted)]">No sticker packs installed yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--token-border-subtle)]">
            {stickersEmoji.installedPackIds.map((packId) => (
              <li key={packId} className="flex items-center justify-between py-3">
                <span className="text-sm text-[var(--token-text-primary)]">{packId}</span>
                <button
                  type="button"
                  onClick={() => removePack(packId)}
                  aria-label={`Remove ${packId}`}
                  className="rounded-md p-1.5 text-[var(--token-text-muted)] hover:bg-[var(--token-card-bg)] hover:text-[var(--token-danger)]"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
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
