import { LockClosedIcon } from '@heroicons/react/24/outline';

interface FilePriceInputProps {
  readonly nodesPrice: number | null;
  readonly onChange: (price: number | null) => void;
}

const MIN_PRICE = 10;
const CREATOR_SHARE = 0.8;

/**
 * Inline price-lock control for file attachments.
 * Toggle enables Node pricing; shows the creator's 80% revenue preview.
 */
export function FilePriceInput({ nodesPrice, onChange }: FilePriceInputProps) {
  const isEnabled = nodesPrice !== null;
  const displayPrice = nodesPrice ?? MIN_PRICE;
  const creatorEarnings = Math.floor(displayPrice * CREATOR_SHARE);

  function handleToggle(): void {
    onChange(isEnabled ? null : MIN_PRICE);
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const raw = Number(e.target.value);
    const clamped = Math.max(MIN_PRICE, Math.round(raw));
    onChange(clamped);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dark-700 bg-dark-800 p-3">
      {/* Toggle row */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-white"
        aria-pressed={isEnabled}
      >
        <span
          className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${
            isEnabled ? 'bg-amber-500' : 'bg-dark-600'
          }`}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
              isEnabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </span>

        <LockClosedIcon className="h-4 w-4" />
        <span>Lock for Nodes</span>
      </button>

      {/* Price input (visible only when enabled) */}
      {isEnabled && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={MIN_PRICE}
              step={1}
              value={displayPrice}
              onChange={handlePriceChange}
              aria-label="Node price"
              className="w-24 rounded-md border border-dark-600 bg-dark-900 px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-xs text-gray-400">Nodes</span>
          </div>

          <p className="text-xs text-gray-500">You&apos;ll receive 80% ({creatorEarnings} Nodes)</p>
        </div>
      )}
    </div>
  );
}
