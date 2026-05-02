/**
 * TypePicker — Cloud vs Secret chat type selector.
 *
 * Users on web default to Cloud Chat (server-readable, works everywhere).
 * Switching to Secret Chat is allowed but the conversation will only
 * become fully functional once the recipient installs mobile or desktop
 * (ADR-022 — web is not a Signal-participant device).
 */
import { useState, type ReactNode } from 'react';

export type ChatTierType = 'secret' | 'cloud';

interface Props {
  readonly onChange: (type: ChatTierType) => void;
  readonly defaultValue?: ChatTierType;
}

/**
 * Renders two radio options letting the user pick Cloud or Secret for a
 * new chat. Defaults to Cloud on web; `onChange` fires whenever the
 * selection changes.
 */
export function TypePicker({ onChange, defaultValue = 'cloud' }: Props): ReactNode {
  const [value, setValue] = useState<ChatTierType>(defaultValue);

  const handle = (next: ChatTierType): void => {
    setValue(next);
    onChange(next);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Chat type</legend>
      <label className="flex items-start gap-3">
        <input
          type="radio"
          name="type"
          aria-label="Cloud Chat"
          checked={value === 'cloud'}
          onChange={() => handle('cloud')}
        />
        <span>
          <span className="block font-medium">Cloud Chat</span>
          <span className="block text-xs text-foreground-muted">
            Works on every device including the web. Server-side encryption.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3">
        <input
          type="radio"
          name="type"
          aria-label="Secret Chat"
          checked={value === 'secret'}
          onChange={() => handle('secret')}
        />
        <span>
          <span className="block font-medium">Secret Chat</span>
          <span className="block text-xs text-foreground-muted">
            Post-quantum E2EE. Only readable on mobile and desktop.
          </span>
        </span>
      </label>
    </fieldset>
  );
}
