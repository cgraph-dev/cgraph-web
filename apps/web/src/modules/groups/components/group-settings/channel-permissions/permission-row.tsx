import { CheckIcon, XCircleIcon, MinusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import type { PermState } from './types';

interface PermissionRowProps {
  bit: number;
  label: string;
  description: string;
  state: PermState;
  onToggle: (bit: number) => void;
  disabled?: boolean;
}

export function PermissionRow({
  bit,
  label,
  description,
  state,
  onToggle,
  disabled = false,
}: PermissionRowProps) {
  return (
    <div className="cgraph-list-row flex items-center justify-between gap-4 bg-[var(--token-bg-secondary)] px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--token-text-primary)]">{label}</p>
        <p className="text-xs text-[var(--token-text-muted)]">{description}</p>
      </div>
      <Button
        variant={state === 'allow' ? 'success' : state === 'deny' ? 'danger' : 'secondary'}
        size="sm"
        animated={false}
        disabled={disabled}
        onClick={() => onToggle(bit)}
        aria-label={`${label}: ${state}`}
        data-permission-state={state}
        leftIcon={
          state === 'allow' ? (
            <CheckIcon aria-hidden="true" />
          ) : state === 'deny' ? (
            <XCircleIcon aria-hidden="true" />
          ) : (
            <MinusIcon aria-hidden="true" />
          )
        }
      >
        {state === 'inherit' ? 'Inherit' : state === 'allow' ? 'Allow' : 'Deny'}
      </Button>
    </div>
  );
}
