/**
 * Channel creation modal dialog.
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { chatLogger as logger } from '@/lib/logger';
import type { Channel } from '@/modules/groups/store';
import { useGroupStore } from '@/modules/groups/store';
import { channelTypeIcons, channelTypes } from './constants';
import type { CreateChannelModalProps } from './types';
import { apiClient } from '@/lib/api-client';
import { FADE_IN } from '@/lib/animations/transitions';

/**
 */
/**
 * Create Channel Modal dialog component.
 */
export function CreateChannelModal({ groupId, categoryId, onClose }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Channel['type']>('text');
  const [isNsfw, setIsNsfw] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { fetchGroup } = useGroupStore();

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      // Narrow channel type to those accepted by the create endpoint
      const validType =
        type === 'voice' || type === 'announcement' || type === 'forum' ? type : 'text';
      const result = await apiClient.groups.createChannel(groupId, {
        name: name.trim(),
        type: validType,
        category_id: categoryId || undefined,
        is_private: isNsfw,
      });
      if (!result.ok) throw new Error(result.error.message);
      logger.log('Created channel:', { groupId, categoryId, name, type, isNsfw });
      HapticFeedback.success();
      // Refresh the group's channel list in the store
      await fetchGroup(groupId);
      onClose();
    } catch (error) {
      logger.error('Failed to create channel:', error);
      HapticFeedback.error();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      {...FADE_IN}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 text-center">
          <SparklesIcon className="mx-auto mb-3 h-10 w-10 text-[var(--color-brand-purple)]" />
          <h2 className="text-xl font-bold text-white">Create Channel</h2>
          <p className="mt-1 text-sm text-gray-400">Add a new channel to your group</p>
        </div>

        <div className="space-y-4">
          {/* Channel Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Channel Type</label>
            <div className="grid grid-cols-5 gap-2">
              {channelTypes.map(({ value, label, icon: TypeIcon }) => (
                <motion.button
                  key={value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setType(value)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-3 transition-all ${
                    type === value
                      ? 'border border-[var(--color-brand-purple)] bg-[color-mix(in_srgb,var(--color-brand-purple)_20%,transparent)]'
                      : 'border border-transparent bg-[var(--token-card-bg)/0.4] hover:border-[var(--token-card-border)]'
                  }`}
                >
                  <TypeIcon
                    className={`h-5 w-5 ${type === value ? 'text-[var(--color-brand-purple)]' : 'text-gray-400'}`}
                  />
                  <span className="text-xs text-gray-300">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Channel Name</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {React.createElement(channelTypeIcons[type], {
                  className: 'h-5 w-5 text-gray-500',
                })}
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="general"
                className="w-full rounded-xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] py-3 pl-10 pr-4 text-white placeholder-white/30 focus:border-[var(--color-brand-purple)] focus:outline-none"
              />
            </div>
          </div>

          {/* NSFW Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-[var(--token-card-bg)/0.4] p-4">
            <div>
              <span className="font-medium text-white">Age-Restricted</span>
              <p className="text-xs text-gray-400">Only members 18+ can view this channel</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsNsfw(!isNsfw)}
              className={`h-6 w-12 rounded-full transition-colors ${
                isNsfw ? 'bg-red-600' : 'bg-[var(--token-card-bg)]'
              }`}
            >
              <motion.div
                animate={{ x: isNsfw ? 24 : 0 }}
                className="h-6 w-6 rounded-full bg-white shadow-lg"
              />
            </motion.button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-[var(--token-card-bg)/0.6] py-3 text-gray-300 transition-colors hover:bg-[var(--token-card-bg)/0.8]"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="flex-1 rounded-xl bg-[var(--color-brand-purple)] py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Channel'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
