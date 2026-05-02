import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { apiClient, http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ChannelsTab');
import { CreateChannelForm } from './create-channel-form';
import { ChannelListItem } from './channel-list-item';
import type { ChannelItem } from './channel-list-item';
import { DeleteChannelModal } from './delete-channel-modal';
import { ChannelPermissionsPanel } from './channel-permissions-panel';
import { ChannelCategoriesPanel } from './channel-categories-panel';
import type { ChannelsTabProps } from './types';
import { FADE_UP } from '@/lib/animations/transitions';

export function ChannelsTab({ groupId }: ChannelsTabProps) {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [permissionsChannelId, setPermissionsChannelId] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'text' | 'voice' | 'announcement'>('text');
  const [newTopic, setNewTopic] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState('');

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const result = await apiClient.groups.getChannels(groupId);
      if (!result.ok) throw new Error(result.error.message);
      // getChannels returns GroupCategory[] with nested channels
      const allChannels: ChannelItem[] = [];
      for (const cat of result.data) {
        if (Array.isArray(cat.channels)) {
          for (const c of cat.channels) {
            const channelType = c.type ?? 'text';
            allChannels.push({
              id: c.id,
              name: c.name,
              type:
                channelType === 'voice'
                  ? 'voice'
                  : channelType === 'announcement'
                    ? 'announcement'
                    : 'text',
              topic: c.topic ?? null,
              position: c.position ?? 0,
              categoryId: c.category_id ?? c.categoryId ?? null,
              nsfw: c.is_nsfw ?? c.isNsfw ?? false,
              slowmodeSeconds: c.slow_mode_seconds ?? c.slowModeSeconds ?? 0,
            });
          }
        }
      }
      setChannels(allChannels.sort((a, b) => a.position - b.position));
    } catch (error) {
      logger.error('Failed to fetch channels', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const result = await apiClient.groups.createChannel(groupId, {
        name: newName.trim().toLowerCase().replace(/\s+/g, '-'),
        type: newType,
        description: newTopic || undefined,
      });
      if (!result.ok) throw new Error(result.error.message);
      setNewName('');
      setNewType('text');
      setNewTopic('');
      setShowCreate(false);
      fetchChannels();
    } catch (error) {
      logger.error('Failed to create channel', error);
    }
  };

  const handleUpdate = async (channelId: string) => {
    try {
      await http.put(`/api/v1/groups/${groupId}/channels/${channelId}`, {
        name: editName.trim().toLowerCase().replace(/\s+/g, '-'),
        topic: editTopic || undefined,
      });
      setEditingId(null);
      fetchChannels();
    } catch (error) {
      logger.error('Failed to update channel', error);
    }
  };

  const handleDelete = async (channelId: string) => {
    try {
      await http.delete(`/api/v1/groups/${groupId}/channels/${channelId}`);
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      setDeleteConfirmId(null);
    } catch (error) {
      logger.error('Failed to delete channel', error);
    }
  };

  const startEdit = (channel: ChannelItem) => {
    setEditingId(channel.id);
    setEditName(channel.name);
    setEditTopic(channel.topic || '');
  };

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-white">Channels</h2>
          <p className="text-gray-400">
            Create and manage channels. {channels.length} channel{channels.length !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          Create Channel
        </motion.button>
      </div>

      {/* Create Channel Form */}
      <CreateChannelForm
        show={showCreate}
        newName={newName}
        newType={newType}
        newTopic={newTopic}
        onNameChange={setNewName}
        onTypeChange={setNewType}
        onTopicChange={setNewTopic}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />

      {/* Channel Categories */}
      <ChannelCategoriesPanel groupId={groupId} />

      {/* Channels List */}
      <GlassCard variant="frosted" className="divide-y divide-gray-700/50">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : channels.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No channels yet. Create one to get started.
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={channels}
            onReorder={setChannels}
            className="divide-y divide-gray-700/50"
          >
            {channels.map((channel, index) => (
              <Reorder.Item key={channel.id} value={channel}>
                <ChannelListItem
                  channel={channel}
                  index={index}
                  editingId={editingId}
                  editName={editName}
                  editTopic={editTopic}
                  onEditNameChange={setEditName}
                  onEditTopicChange={setEditTopic}
                  onSave={handleUpdate}
                  onCancelEdit={() => setEditingId(null)}
                  onStartEdit={startEdit}
                  onDelete={(id) => setDeleteConfirmId(id)}
                  onPermissions={(id) => setPermissionsChannelId(id)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </GlassCard>

      {/* Delete Confirmation Modal */}
      <DeleteChannelModal
        deleteConfirmId={deleteConfirmId}
        onDelete={handleDelete}
        onClose={() => setDeleteConfirmId(null)}
      />

      {/* Permissions Panel Modal */}
      <AnimatePresence>
        {permissionsChannelId && (
          <ChannelPermissionsPanel
            groupId={groupId}
            channelId={permissionsChannelId}
            channelName={channels.find((c) => c.id === permissionsChannelId)?.name ?? 'channel'}
            onClose={() => setPermissionsChannelId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
