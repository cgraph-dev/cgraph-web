/**
 * Spaces route owner.
 *
 * Spaces are first-class chat-list folders backed by `/api/v1/spaces`.
 */

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  FolderIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { http } from '@/lib/api-client';
import { ensureArray } from '@/lib/api-utils';
import { createLogger } from '@/lib/logger';
import { useAuthStore } from '@/modules/auth/store';
import { useChatStore } from '@/modules/chat/store/chatStore.impl';
import { SpaceFilterEditor } from '@/modules/chat/components/spaces/space-filter-editor';
import {
  conversationMatchesSpace,
  getConversationName,
  readConversationSpace,
  type ConversationSpace as Space,
} from '@/modules/chat/components/conversation-list';
import { tweens } from '@/lib/animation-presets';
import { FADE_IN, FADE_UP } from '@/lib/animations/transitions';

const logger = createLogger('SpacesPage');

interface NewSpaceFormState {
  readonly name: string;
  readonly emoji: string;
  readonly includeAllIndividual: boolean;
  readonly includeAllGroups: boolean;
  readonly showOnlyUnread: boolean;
  readonly showMuted: boolean;
}

const DEFAULT_FORM: NewSpaceFormState = {
  name: '',
  emoji: '',
  includeAllIndividual: true,
  includeAllGroups: true,
  showOnlyUnread: false,
  showMuted: true,
};

function spacePayload(form: NewSpaceFormState): Record<string, unknown> {
  return {
    name: form.name.trim(),
    emoji: form.emoji.trim(),
    include_all_individual: form.includeAllIndividual,
    include_all_groups: form.includeAllGroups,
    show_only_unread: form.showOnlyUnread,
    show_muted: form.showMuted,
  };
}

function formFromSpace(space: Space): NewSpaceFormState {
  return {
    name: space.name,
    emoji: space.emoji,
    includeAllIndividual: space.includeAllIndividual,
    includeAllGroups: space.includeAllGroups,
    showOnlyUnread: space.showOnlyUnread,
    showMuted: space.showMuted,
  };
}

/**
 * First-class Spaces route.
 */
export default function SpacesPage() {
  const { spaceId } = useParams<{ spaceId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, fetchConversations } = useChatStore();
  const [spaces, setSpaces] = useState<readonly Space[]>([]);
  const [form, setForm] = useState<NewSpaceFormState>(DEFAULT_FORM);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [spacePendingDelete, setSpacePendingDelete] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSpaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [spacesResponse] = await Promise.all([
        http.get('/api/v1/spaces'),
        fetchConversations().catch((fetchError: unknown) => {
          logger.warn('Failed to refresh conversations for Spaces:', fetchError);
        }),
      ]);

      const parsed = ensureArray<unknown>(spacesResponse.data)
        .map(readConversationSpace)
        .filter((space): space is Space => Boolean(space));
      setSpaces((current) => {
        const byId = new Map(parsed.map((space) => [space.id, space]));
        for (const space of current) {
          if (!byId.has(space.id)) byId.set(space.id, space);
        }
        return [...byId.values()].sort((a, b) => a.position - b.position);
      });
    } catch (loadError) {
      logger.error('Failed to load Spaces:', loadError);
      setError('Spaces could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchConversations]);

  useEffect(() => {
    void loadSpaces();
  }, [loadSpaces]);

  const selectedSpace = useMemo(
    () => spaces.find((space) => space.id === spaceId) ?? null,
    [spaceId, spaces]
  );
  const editingSpace = useMemo(
    () => spaces.find((space) => space.id === editingSpaceId) ?? null,
    [editingSpaceId, spaces]
  );

  useEffect(() => {
    if (editingSpaceId && selectedSpace?.id !== editingSpaceId) {
      setEditingSpaceId(null);
      setForm(DEFAULT_FORM);
    }
  }, [editingSpaceId, selectedSpace?.id]);

  const visibleConversations = useMemo(() => {
    if (!selectedSpace) return conversations;
    return conversations.filter((conversation) =>
      conversationMatchesSpace(conversation, selectedSpace)
    );
  }, [conversations, selectedSpace]);

  function startEditingSpace(space: Space): void {
    setError(null);
    setForm(formFromSpace(space));
    setEditingSpaceId(space.id);
  }

  function cancelEditingSpace(): void {
    setEditingSpaceId(null);
    setForm(DEFAULT_FORM);
  }

  async function handleSaveSpace(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!form.name.trim() || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = editingSpace
        ? await http.patch(`/api/v1/spaces/${editingSpace.id}`, spacePayload(form))
        : await http.post('/api/v1/spaces', spacePayload(form));
      const saved = readConversationSpace(response.data);
      if (!saved) throw new Error('Space response did not include a Space');

      setSpaces((current) => {
        const next = editingSpace
          ? current.map((space) => (space.id === saved.id ? saved : space))
          : [...current, saved];
        return [...next].sort((a, b) => a.position - b.position);
      });
      setForm(DEFAULT_FORM);
      setEditingSpaceId(null);
      navigate(`/spaces/${saved.id}`);
    } catch (saveError) {
      logger.error('Failed to save Space:', saveError);
      setError('Space could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSpace(): Promise<void> {
    if (!spacePendingDelete || isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      await http.delete(`/api/v1/spaces/${spacePendingDelete.id}`);
      setSpaces((current) => current.filter((space) => space.id !== spacePendingDelete.id));
      if (editingSpaceId === spacePendingDelete.id) cancelEditingSpace();
      setSpacePendingDelete(null);
      navigate('/spaces');
    } catch (deleteError) {
      logger.error('Failed to delete Space:', deleteError);
      setError('Space could not be deleted.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="flex h-full min-h-0 flex-1 bg-transparent" aria-label="Spaces">
      <aside className="bg-[var(--token-card-bg)]/35 flex h-full w-80 shrink-0 flex-col border-r border-[var(--token-card-border)] backdrop-blur-3xl">
        <div className="border-b border-[var(--token-card-border)] p-5">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <FolderIcon className="h-6 w-6 text-primary-300" />
            Spaces
          </h1>
          <p className="mt-1 text-sm text-white/45">Organize conversations into routed lists.</p>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-3" aria-label="Space list">
          <NavLink
            to="/spaces"
            end
            className={({ isActive }) =>
              `mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary-500/15 text-primary-100'
                  : 'text-white/70 hover:bg-white/[0.08]'
              }`
            }
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            All conversations
          </NavLink>

          {spaces.map((space) => (
            <NavLink
              key={space.id}
              to={`/spaces/${space.id}`}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-500/15 text-primary-100'
                    : 'text-white/70 hover:bg-white/[0.08]'
                }`
              }
            >
              <span className="bg-white/8 flex h-7 w-7 items-center justify-center rounded-md text-base">
                {space.emoji || <FolderIcon className="h-4 w-4" />}
              </span>
              <span className="truncate font-medium">{space.name}</span>
            </NavLink>
          ))}
        </nav>

        <form
          onSubmit={handleSaveSpace}
          className="border-t border-[var(--token-card-border)] p-4"
          aria-label={editingSpace ? 'Edit Space' : 'Create Space'}
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            {editingSpace ? (
              <PencilSquareIcon className="h-4 w-4 text-primary-300" />
            ) : (
              <PlusIcon className="h-4 w-4 text-primary-300" />
            )}
            {editingSpace ? 'Edit Space' : 'New Space'}
          </div>
          <div className="flex gap-2">
            <input
              value={form.emoji}
              onChange={(event) => setForm((state) => ({ ...state, emoji: event.target.value }))}
              className="h-10 w-14 rounded-md border border-white/10 bg-black/20 px-2 text-center text-sm text-white outline-none focus:border-primary-400"
              placeholder="Icon"
              aria-label="Space icon"
              maxLength={8}
            />
            <input
              value={form.name}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
              className="h-10 min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary-400"
              placeholder="Space name"
              aria-label="Space name"
              maxLength={64}
            />
          </div>

          <div className="mt-3">
            <SpaceFilterEditor
              showOnlyUnread={form.showOnlyUnread}
              showMuted={form.showMuted}
              onShowOnlyUnreadChange={(value) =>
                setForm((state) => ({ ...state, showOnlyUnread: value }))
              }
              onShowMutedChange={(value) => setForm((state) => ({ ...state, showMuted: value }))}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2 py-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={form.includeAllIndividual}
                onChange={(event) =>
                  setForm((state) => ({ ...state, includeAllIndividual: event.target.checked }))
                }
              />
              Direct
            </label>
            <label className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2 py-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={form.includeAllGroups}
                onChange={(event) =>
                  setForm((state) => ({ ...state, includeAllGroups: event.target.checked }))
                }
              />
              Groups
            </label>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="submit"
              disabled={!form.name.trim() || isSaving}
              className="col-span-2 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary-500 px-3 text-sm font-semibold text-dark-950 transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editingSpace ? (
                <PencilSquareIcon className="h-4 w-4" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
              {editingSpace ? 'Save changes' : 'Create Space'}
            </button>
            {editingSpace && (
              <button
                type="button"
                onClick={cancelEditingSpace}
                disabled={isSaving}
                className="col-span-2 h-9 rounded-md border border-white/10 px-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </aside>

      <section className="min-w-0 flex-1 overflow-y-auto p-6" aria-label="Space conversations">
        <motion.div {...FADE_UP} transition={tweens.smooth} className="mb-6">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary-200">
            <SparklesIcon className="h-4 w-4" />
            {selectedSpace ? 'Selected Space' : 'All Spaces'}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white">
            {selectedSpace ? selectedSpace.name : 'All conversations'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/50">
            {selectedSpace
              ? 'This routed Space applies its server-owned filter rules to your conversation list.'
              : 'Pick or create a Space to focus the conversation list.'}
          </p>
          {selectedSpace && (
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => startEditingSpace(selectedSpace)}
                className="grid h-9 w-9 place-items-center rounded-md border border-white/10 text-white/70 transition-colors hover:border-primary-400/60 hover:bg-primary-500/10 hover:text-white"
                aria-label={`Edit ${selectedSpace.name}`}
                title="Edit Space"
              >
                <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setSpacePendingDelete(selectedSpace)}
                className="grid h-9 w-9 place-items-center rounded-md border border-white/10 text-white/70 transition-colors hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-200"
                aria-label={`Delete ${selectedSpace.name}`}
                title="Delete Space"
              >
                <TrashIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </motion.div>

        {error && (
          <div className="mb-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
            Loading Spaces...
          </div>
        ) : visibleConversations.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
            No conversations match this Space.
          </div>
        ) : (
          <motion.div {...FADE_IN} transition={tweens.standard} className="grid gap-2">
            {visibleConversations.map((conversation) => (
              <NavLink
                key={conversation.id}
                to={`/messages/${conversation.id}`}
                className="hover:border-primary-400/40 hover:bg-primary-500/10 group flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {getConversationName(conversation, user?.id ?? '')}
                  </p>
                  <p className="mt-1 truncate text-xs text-white/45">
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
                {conversation.unreadCount > 0 && (
                  <span className="rounded-full bg-primary-400 px-2 py-0.5 text-xs font-bold text-dark-950">
                    {conversation.unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </motion.div>
        )}
      </section>

      <Dialog
        open={Boolean(spacePendingDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setSpacePendingDelete(null);
        }}
      >
        <DialogContent ariaLabel="Delete Space">
          <h2 className="text-lg font-semibold text-[var(--token-text-primary)]">Delete Space?</h2>
          <p className="mt-2 text-sm text-[var(--token-text-muted)]">
            {spacePendingDelete
              ? `${spacePendingDelete.name} will be removed from your Spaces.`
              : ''}
          </p>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setSpacePendingDelete(null)}
              disabled={isDeleting}
              className="rounded-lg border border-[var(--token-border-subtle)] px-3 py-2 text-sm font-semibold text-[var(--token-text-primary)] transition hover:bg-[var(--token-bg-secondary)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void deleteSpace()}
              disabled={isDeleting}
              className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Space'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
