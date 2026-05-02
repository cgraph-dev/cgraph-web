/** @module Reusable privacy toggle switch sub-component. */

interface PrivacyToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}

/**
 * A labelled toggle switch used in privacy settings panels.
 */
export function PrivacyToggle({
  label,
  description,
  checked,
  disabled,
  onToggle,
}: PrivacyToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium text-[var(--token-text-primary)]">{label}</h3>
        <p className="text-sm text-[var(--token-text-muted)]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        disabled={disabled}
        data-checked={checked}
        className={`aurora-social-toggle relative h-6 w-11 rounded-full ${disabled ? 'opacity-50' : ''}`}
      >
        <span className="aurora-social-toggle-thumb absolute left-1 top-1 h-4 w-4 rounded-full" />
      </button>
    </div>
  );
}
