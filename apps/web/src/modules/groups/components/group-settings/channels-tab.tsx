import { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Card from '@/components/ui/card';
import Skeleton from '@/components/ui/skeleton';
import { http } from '@/lib/api-client';
import { asNumber, asOptionalString, asString, ensureArray } from '@/lib/api-utils';
import { createLogger } from '@/lib/logger';
import { getGroupPermissionError } from '../../permission-errors';
import { CreateChannelForm } from './create-channel-form';
import { ChannelListItem } from './channel-list-item';
import type { ChannelItem } from './channel-list-item';
import { DeleteChannelModal } from './delete-channel-modal';
import { ChannelPermissionsPanel } from './channel-permissions-panel';
import { ChannelCategoriesPanel } from './channel-categories-panel';
import type { ChannelsTabProps } from './types';
import { FADE_UP } from '@/lib/animations/transitions';

const logger = createLogger('ChannelsTab');

function normalizeChannelName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

function parseChannels(payload: unknown): ChannelItem[] {
  return ensureArray<Record<string, unknown>>(payload)
    .flatMap((record) =>
      Array.isArray(record.channels)
        ? ensureArray<Record<string, unknown>>(record.channels)
        : [record]
    )
    .map((channel) => {
      const type = asString(channel.type, 'text');
      return {
        id: asString(channel.id),
        name: asString(channel.name),
        type:
          type === 'voice' ? 'voice' : type === 'announcement' ? 'announcement' : ('text' as const),
        topic: asOptionalString(channel.topic) ?? null,
        position: asNumber(channel.position),
        categoryId:
          asOptionalString(channel.category_id) ?? asOptionalString(channel.categoryId) ?? null,
        nsfw: Boolean(channel.nsfw ?? channel.is_nsfw ?? channel.isNsfw),
        slowmodeSeconds: asNumber(
          channel.slowmode_seconds ?? channel.slow_mode_seconds ?? channel.slowModeSeconds
        ),
      } satisfies ChannelItem;
    })
    .sort((left, right) => left.position - right.position);
}

export function ChannelsTab({ groupId }: ChannelsTabProps) {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [permissionsChannelId, setPermissionsChannelId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationKey, setMutationKey] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'text' | 'voice' | 'announcement'>('text');
  const [newTopic, setNewTopic] = useState('');

  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState('');

  const fetchChannels = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await http.get(`/api/v1/groups/${groupId}/channels`);
      setChannels(parseChannels(response.data));
      return true;
    } catch (error) {
      logger.error('Failed to fetch channels', error);
      setLoadError('Could not load channels. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleCreate = async () => {
    if (!newName.trim() || mutationKey) return;
    setMutationKey('create');
    setMutationError(null);
    try {
      await http.post(`/api/v1/groups/${groupId}/channels`, {
        name: normalizeChannelName(newName),
        type: newType,
        topic: newTopic.trim() || undefined,
      });
      setNewName('');
      setNewType('text');
      setNewTopic('');
      setShowCreate(false);
      await fetchChannels();
    } catch (error) {
      logger.error('Failed to create channel', error);
      setMutationError(
        getGroupPermissionError(
          error,
          'You do not have permission to create channels.',
          'Could not create the channel. Please try again.'
        )
      );
    } finally {
      setMutationKey(null);
    }
  };

  const handleUpdate = async (channelId: string) => {
    if (!editName.trim() || mutationKey) return;
    setMutationKey(`save:${channelId}`);
    setMutationError(null);
    try {
      await http.put(`/api/v1/groups/${groupId}/channels/${channelId}`, {
        name: normalizeChannelName(editName),
        topic: editTopic.trim() || undefined,
      });
      setEditingId(null);
      await fetchChannels();
    } catch (error) {
      logger.error('Failed to update channel', error);
      setMutationError(
        getGroupPermissionError(
          error,
          'You do not have permission to update channels.',
          'Could not update the channel. Please try again.'
        )
      );
    } finally {
      setMutationKey(null);
    }
  };

  const handleDelete = async (channelId: string) => {
    if (mutationKey) return;
    setMutationKey(`delete:${channelId}`);
    setMutationError(null);
    try {
      await http.delete(`/api/v1/groups/${groupId}/channels/${channelId}`);
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      setDeleteConfirmId(null);
    } catch (error) {
      logger.error('Failed to delete channel', error);
      setMutationError(
        getGroupPermissionError(
          error,
          'You do not have permission to delete channels.',
          'Could not delete the channel. Please try again.'
        )
      );
    } finally {
      setMutationKey(null);
    }
  };

  const startEdit = (channel: ChannelItem) => {
    setEditingId(channel.id);
    setEditName(channel.name);
    setEditTopic(channel.topic || '');
  };

  const handleMoveChannel = async (index: number, offset: -1 | 1) => {
    const targetIndex = index + offset;
    if (mutationKey || targetIndex < 0 || targetIndex >= channels.length) return;

    const previousOrder = channels;
    const nextOrder = [...channels];
    [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex]!, nextOrder[index]!];

    setChannels(nextOrder);
    setMutationKey('reorder');
    setMutationError(null);

    try {
      await http.put(`/api/v1/groups/${groupId}/channels/reorder`, {
        channel_ids: nextOrder.map((channel) => channel.id),
      });
    } catch (error) {
      logger.warn('Failed to reorder channels, reverting', error);
      setChannels(previousOrder);
      setMutationError(
        getGroupPermissionError(
          error,
          'You do not have permission to reorder channels.',
          'Could not save the channel order.'
        )
      );
      await fetchChannels();
    } finally {
      setMutationKey(null);
    }
  };

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-[var(--token-text-primary)]">Channels</h2>
          <p className="text-[var(--token-text-muted)]">
            Create and manage channels. {channels.length} channel{channels.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          size="sm"
          leftIcon={<PlusIcon aria-hidden="true" />}
          disabled={mutationKey !== null}
          onClick={() => setShowCreate(true)}
          aria-expanded={showCreate}
          className="min-h-11 lg:min-h-10"
        >
          Create Channel
        </Button>
      </div>

      {mutationError && (
        <div
          role="alert"
          className="cgraph-section-surface border-[var(--token-feedback-error)] px-4 py-3 text-sm text-[var(--token-feedback-error)]"
        >
          {mutationError}
        </div>
      )}

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
        disabled={mutationKey !== null}
      />

      <ChannelCategoriesPanel groupId={groupId} />

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-4" aria-label="Loading channels" role="status">
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
          </div>
        ) : loadError ? (
          <div className="px-4 py-6 text-center" role="alert">
            <p className="text-sm text-[var(--token-feedback-error)]">{loadError}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchChannels}>
              Retry
            </Button>
          </div>
        ) : channels.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--token-text-muted)]">
            No channels yet. Create one to get started.
          </div>
        ) : (
          <div
            role="list"
            aria-label="Channels"
            className="divide-y divide-[var(--token-border-muted)]"
          >
            {channels.map((channel, index) => (
              <ChannelListItem
                key={channel.id}
                channel={channel}
                index={index}
                totalCount={channels.length}
                editingId={editingId}
                editName={editName}
                editTopic={editTopic}
                reorderDisabled={mutationKey === 'reorder'}
                disabled={mutationKey !== null}
                saving={mutationKey === `save:${channel.id}`}
                onEditNameChange={setEditName}
                onEditTopicChange={setEditTopic}
                onSave={handleUpdate}
                onCancelEdit={() => setEditingId(null)}
                onStartEdit={startEdit}
                onDelete={(id) => setDeleteConfirmId(id)}
                onPermissions={(id) => setPermissionsChannelId(id)}
                onMoveUp={() => handleMoveChannel(index, -1)}
                onMoveDown={() => handleMoveChannel(index, 1)}
              />
            ))}
          </div>
        )}
      </Card>

      <DeleteChannelModal
        deleteConfirmId={deleteConfirmId}
        onDelete={handleDelete}
        onClose={() => setDeleteConfirmId(null)}
        isDeleting={mutationKey === `delete:${deleteConfirmId}`}
      />

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
