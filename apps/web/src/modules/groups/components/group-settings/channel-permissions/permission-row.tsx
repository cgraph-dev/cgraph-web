import { CheckIcon, XCircleIcon, MinusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import type { PermState } from './types';

interface PermissionRowProps {
  bit: number;
  label: string;
  description: string;
  state: PermState;
  onToggle: (bit: number) => void;
}

/**
 * Permission Row component.
 */
export function PermissionRow({ bit, label, description, state, onToggle }: PermissionRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--token-card-bg)/0.6]">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <Button
        variant={state === 'allow' ? 'success' : state === 'deny' ? 'danger' : 'secondary'}
        size="sm"
        animated={false}
        onClick={() => onToggle(bit)}
        aria-label={`${label}: ${state}`}
        data-permission-state={state}
        leftIcon={
          state === 'allow' ? (
            <CheckIcon />
          ) : state === 'deny' ? (
            <XCircleIcon />
          ) : (
            <MinusIcon />
          )
        }
      >
        {state === 'inherit' ? 'Inherit' : state === 'allow' ? 'Allow' : 'Deny'}
      </Button>
    </div>
  );
}
