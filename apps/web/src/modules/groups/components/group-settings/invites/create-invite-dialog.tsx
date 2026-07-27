import { useState } from 'react';
import {
  CheckIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input, Select } from '@/components/ui/input';
import { EXPIRATION_OPTIONS, MAX_USES_OPTIONS } from './useGroupInvites';
import type {
  CreateInviteOptions,
  GroupInviteView,
  InviteOperationResult,
} from './types';

interface CreateInviteDialogProps {
  open: boolean;
  groupName: string;
  isCreating: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    options: CreateInviteOptions
  ) => Promise<InviteOperationResult<GroupInviteView>>;
  onCopy: (url: string) => Promise<InviteOperationResult<undefined>>;
}

export function CreateInviteDialog({
  open,
  groupName,
  isCreating,
  onOpenChange,
  onCreate,
  onCopy,
}: CreateInviteDialogProps) {
  const [expiration, setExpiration] = useState('86400');
  const [maxUses, setMaxUses] = useState('');
  const [createdInvite, setCreatedInvite] = useState<GroupInviteView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const close = () => {
    setCreatedInvite(null);
    setErrorMessage(null);
    setCopied(false);
    onOpenChange(false);
  };

  const create = async () => {
    setErrorMessage(null);
    const result = await onCreate({
      expirationSeconds: expiration ? Number(expiration) : null,
      maxUses: maxUses ? Number(maxUses) : null,
    });
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    setCreatedInvite(result.data);
  };

  const copy = async () => {
    if (!createdInvite) return;
    const result = await onCopy(createdInvite.url);
    setCopied(result.ok);
    setErrorMessage(result.ok ? null : result.error);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}>
      <DialogContent
        ariaLabel="Create invite link"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" aria-hidden="true" />
            Create invite link
          </DialogTitle>
          <DialogDescription>
            Choose how long the link works and how many people may use it for {groupName}.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-[var(--token-feedback-error)]/40 bg-[var(--token-feedback-error)]/10 px-3 py-2 text-sm text-[var(--token-feedback-error)]"
          >
            {errorMessage}
          </p>
        )}

        {createdInvite ? (
          <div className="space-y-3">
            <Input label="Invite link" value={createdInvite.url} readOnly />
            <Button
              fullWidth
              variant={copied ? 'success' : 'outline'}
              leftIcon={copied ? <CheckIcon /> : <ClipboardDocumentIcon />}
              onClick={copy}
            >
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              label="Expire after"
              options={[...EXPIRATION_OPTIONS]}
              value={expiration}
              disabled={isCreating}
              onChange={(event) => setExpiration(event.target.value)}
            />
            <Select
              label="Maximum uses"
              options={[...MAX_USES_OPTIONS]}
              value={maxUses}
              disabled={isCreating}
              onChange={(event) => setMaxUses(event.target.value)}
            />
          </div>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button variant="ghost" onClick={close} disabled={isCreating}>
            {createdInvite ? 'Done' : 'Cancel'}
          </Button>
          {!createdInvite && (
            <Button
              leftIcon={<PlusIcon />}
              isLoading={isCreating}
              disabled={isCreating}
              onClick={create}
            >
              Create link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
