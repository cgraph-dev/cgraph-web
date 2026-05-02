/**
 * WebOnlyRecipientPrompt — warns the sender when the recipient has no
 * Signal-participant device (mobile or desktop) and the sender picked
 * Secret Chat. Offers a one-click downgrade to Cloud Chat so the message
 * actually reaches the recipient.
 */
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { fetchDeviceCapability } from '@/lib/api/conversations/device-capability';
import type { ChatTierType } from './type-picker';

interface Props {
  readonly recipientId: string;
  readonly chosenType: ChatTierType;
  readonly onChange: (next: ChatTierType) => void;
}

const CAPABILITY_STALE_MS = 60_000;

/**
 * Renders the amber warning banner described above. Returns null when
 * the recipient is reachable over Signal or the sender already chose
 * Cloud Chat.
 */
export function WebOnlyRecipientPrompt({ recipientId, chosenType, onChange }: Props): ReactNode {
  const isSecretPick = chosenType === 'secret';

  const { data } = useQuery({
    queryKey: ['device-capability', recipientId],
    queryFn: () => fetchDeviceCapability(recipientId),
    enabled: isSecretPick && recipientId.length > 0,
    staleTime: CAPABILITY_STALE_MS,
  });

  if (!isSecretPick || !data || data.canReceiveSecret) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-[var(--token-text-primary)]"
    >
      <p className="font-medium">This person only has a web session.</p>
      <p className="mt-1 text-[var(--token-text-secondary)]">
        Secret Chats can&apos;t reach them. Send as Cloud Chat instead?
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-2"
        onClick={() => onChange('cloud')}
      >
        Send as Cloud Chat
      </Button>
    </div>
  );
}
