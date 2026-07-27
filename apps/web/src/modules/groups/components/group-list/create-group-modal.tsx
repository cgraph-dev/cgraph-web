/**
 * Create Group Modal
 *
 * Modal dialog for creating a new group.
 * Uses React 19 useActionState for form state management.
 */

import { useState, useActionState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useGroupStore } from '@/modules/groups/store';
import { GlassCard } from '@/shared/components/ui';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';
import type { CreateGroupModalProps } from './types';
import { getGroupRoute } from '@/modules/groups/routing';

const logger = createLogger('CreateGroupModal');

interface CreateGroupState {
  error: string | null;
}

/**
 */
/**
 * Create Group Modal dialog component.
 */
export function CreateGroupModal({ isOpen, onClose, onSubmit }: CreateGroupModalProps) {
  const { createGroup } = useGroupStore();
  const [isPublic, setIsPublic] = useState(true);
  const navigate = useNavigate();

  function getFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
  }

  const [state, formAction, isPending] = useActionState(
    async (_prev: CreateGroupState, formData: FormData): Promise<CreateGroupState> => {
      const name = getFormString(formData, 'name').trim();
      const description = getFormString(formData, 'description').trim();

      if (!name) return { error: 'Group name is required' };

      try {
        if (onSubmit) {
          await onSubmit({ name, description, isPublic });
        } else {
          const group = await createGroup({
            name,
            description: description || undefined,
            isPublic,
          });
          navigate(getGroupRoute(group));
        }
        HapticFeedback.success();
        onClose();
        return { error: null };
      } catch (error) {
        logger.error('Failed to create group:', error);
        HapticFeedback.error();
        return { error: 'Failed to create group. Please try again.' };
      }
    },
    { error: null }
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent ariaLabel="Create a Group">
        <GlassCard className="border-0 bg-transparent p-0 shadow-none" data-testid="glass-card">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="cgraph-empty-icon mb-0 h-11 w-11 shrink-0">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle>Create a Group</DialogTitle>
                <DialogDescription>
                  Build your community with friends and like-minded people
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form action={formAction}>
            {state.error && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
              >
                {state.error}
              </p>
            )}

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-[var(--token-text-secondary)]">
                Group Name
                <input
                  type="text"
                  name="name"
                  placeholder="My Awesome Group"
                  required
                  className="cgraph-field mt-2 w-full"
                />
              </label>

              <label className="block text-sm font-medium text-[var(--token-text-secondary)]">
                Description (optional)
                <textarea
                  name="description"
                  placeholder="What's your group about?"
                  rows={3}
                  className="cgraph-field mt-2 w-full resize-none"
                />
              </label>

              <div
                className="cgraph-list-row flex items-center justify-between gap-4"
                data-cgraph-material="recessed"
              >
                <div>
                  <label
                    htmlFor="create-group-public"
                    className="text-sm font-medium text-[var(--token-text-primary)]"
                  >
                    Public Group
                  </label>
                  <p className="text-xs text-[var(--token-text-muted)]">
                    Anyone can discover and join
                  </p>
                </div>
                <Switch
                  id="create-group-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" animated={false} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" animated={false} isLoading={isPending}>
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </GlassCard>
      </DialogContent>
    </Dialog>
  );
}
