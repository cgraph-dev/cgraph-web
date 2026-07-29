/**
 * Toggle switch component.
 */

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Switch component.
 */
export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}: SwitchProps) {
  const sizes = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'h-3 w-3',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'h-5 w-5',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'h-6 w-6',
    },
  };

  const currentSize = sizes[size];
  return (
    <label
      className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`aurora-social-toggle relative inline-flex flex-shrink-0 ${size === 'sm' ? 'aurora-social-toggle--compact' : size === 'lg' ? 'aurora-social-toggle--large' : ''} ${currentSize.track} rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900`}
      >
        <span
          className={`aurora-social-toggle-thumb absolute left-0.5 top-0.5 ${currentSize.thumb} inline-block rounded-full`}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-white">{label}</span>}
          {description && <span className="mt-0.5 text-xs text-gray-400">{description}</span>}
        </div>
      )}
    </label>
  );
}
