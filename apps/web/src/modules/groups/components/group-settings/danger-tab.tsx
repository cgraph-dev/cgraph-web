import { ArrowRightOnRectangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Card from '@/components/ui/card';
import type { DangerTabProps } from './types';

export function DangerTab({ isOwner, errorMessage, onLeave, onDelete }: DangerTabProps) {
  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-[var(--token-feedback-error)]">Danger Zone</h2>
        <p className="mt-2 text-[var(--token-text-secondary)]">
          These actions are irreversible. Please proceed with caution.
        </p>
      </header>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-[var(--product-radius-md)] border border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] px-4 py-3 text-sm text-[var(--token-feedback-error)]"
        >
          {errorMessage}
        </div>
      )}

      <div className="space-y-4">
        <Card
          padding="lg"
          className="border-[color-mix(in_srgb,var(--token-feedback-error)_35%,var(--token-card-border))]"
        >
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h3 className="font-semibold text-[var(--token-text-primary)]">Leave Group</h3>
              <p className="mt-1 text-sm text-[var(--token-text-muted)]">
                You will need an invite to rejoin.
              </p>
            </div>
            <Button
              variant="danger"
              leftIcon={<ArrowRightOnRectangleIcon aria-hidden="true" />}
              onClick={onLeave}
            >
              Leave
            </Button>
          </div>
        </Card>

        {isOwner && (
          <Card
            padding="lg"
            className="border-[color-mix(in_srgb,var(--token-feedback-error)_50%,var(--token-card-border))]"
          >
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--token-text-primary)]">Delete Group</h3>
                <p className="mt-1 text-sm text-[var(--token-text-muted)]">
                  Permanently delete this group and all its data.
                </p>
              </div>
              <Button
                variant="danger"
                leftIcon={<TrashIcon aria-hidden="true" />}
                onClick={onDelete}
              >
                Delete
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
