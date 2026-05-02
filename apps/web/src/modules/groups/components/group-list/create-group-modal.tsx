/**
 * Create Group Modal
 *
 * Modal dialog for creating a new group.
 * Uses React 19 useActionState for form state management.
 */

import { useState, useActionState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useGroupStore } from '@/modules/groups/store';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';
import type { CreateGroupModalProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';
import { getGroupRoute } from '@/modules/groups/routing';

const logger = createLogger('CreateGroupModal');

interface CreateGroupState {
  error: string | null;
}

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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          {...FADE_IN}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.2 },
            }}
            className="group relative w-full max-w-md overflow-hidden rounded-[26px] p-[1.5px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Landing Navbar Style Border - Persistent & Razor Sharp */}
            <motion.div
              className="absolute inset-0 z-0 bg-[linear-gradient(90deg,transparent_0%,#10b981_25%,var(--color-brand-purple)_50%,#3b82f6_75%,transparent_100%)]"
              style={{ backgroundSize: '200% 100%', WebkitBackfaceVisibility: 'hidden' }}
              animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />

            <GlassCard
              variant="default"
              hover3D={false}
              className="relative z-10 !rounded-[24.5px] border-none bg-[var(--token-bg-primary)] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
            >
              <div className="mb-6 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={loop(tweens.ambient)}
                  className="mb-4 inline-block"
                >
                  <SparklesIcon className="text-primary-400/60 h-12 w-12" />
                </motion.div>
                <h2 className="text-xl font-bold text-white/90">Create a Group</h2>
                <p className="mt-1 text-[13px] font-medium text-white/40">
                  Build your community with friends and like-minded people
                </p>
              </div>

              <form action={formAction}>
                {state.error && (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {state.error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[13px] font-bold text-white/40">
                      Group Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="My Awesome Group"
                      required
                      className="w-full rounded-xl border border-[var(--token-border-muted)] bg-black/40 px-4 py-3 text-[13px] text-white placeholder-white/20 shadow-[rgba(255,255,255,0.02)_0px_1px_1px_inset] transition-all hover:bg-black/60 focus:border-[var(--token-card-border)] focus:bg-black/80 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[13px] font-bold text-white/40">
                      Description (optional)
                    </label>
                    <textarea
                      name="description"
                      placeholder="What's your group about?"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-[var(--token-border-muted)] bg-black/40 px-4 py-3 text-[13px] text-white placeholder-white/20 shadow-[rgba(255,255,255,0.02)_0px_1px_1px_inset] transition-all hover:bg-black/60 focus:border-[var(--token-card-border)] focus:bg-black/80 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[var(--token-border-muted)] bg-black/20 p-4">
                    <div>
                      <span className="text-[14px] font-bold text-white/80">Public Group</span>
                      <p className="text-[12px] font-medium text-white/30">
                        Anyone can discover and join
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => setIsPublic(!isPublic)}
                      className={`h-6 w-11 rounded-full transition-all duration-300 ${
                        isPublic
                          ? 'bg-[color-mix(in_srgb,var(--color-brand-purple)_60%,transparent)]'
                          : 'bg-white/10'
                      }`}
                    >
                      <motion.div
                        animate={{ x: isPublic ? 22 : 2 }}
                        className="h-4 w-4 rounded-full bg-white shadow-lg"
                      />
                    </motion.button>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-bg-primary)/0.3] py-3 text-[13px] font-bold text-white/40 transition-all hover:border-[var(--token-card-border)] hover:bg-[var(--token-card-bg)/0.6] hover:text-white/80"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-xl border border-[color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-purple)_10%,transparent)] py-3 text-[13px] font-bold text-[var(--color-brand-purple)] shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all hover:bg-[color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--color-brand-purple)_30%,transparent)] border-t-[var(--color-brand-purple)]" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Group'
                    )}
                  </motion.button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
