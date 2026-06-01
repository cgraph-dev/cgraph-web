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
  PlusIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'motion/react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  const visibleConversations = useMemo(() => {
    if (!selectedSpace) return conversations;
    return conversations.filter((conversation) =>
      conversationMatchesSpace(conversation, selectedSpace)
    );
  }, [conversations, selectedSpace]);

  async function handleCreateSpace(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!form.name.trim() || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await http.post('/api/v1/spaces', spacePayload(form));
      const created = readConversationSpace(response.data);
      if (!created) throw new Error('Space response did not include a Space');
      setSpaces((current) => [...current, created].sort((a, b) => a.position - b.position));
      setForm(DEFAULT_FORM);
      navigate(`/spaces/${created.id}`);
    } catch (createError) {
      logger.error('Failed to create Space:', createError);
      setError('Space could not be created.');
    } finally {
      setIsSaving(false);
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
          onSubmit={handleCreateSpace}
          className="border-t border-[var(--token-card-border)] p-4"
          aria-label="Create Space"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <PlusIcon className="h-4 w-4 text-primary-300" />
            New Space
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

          <button
            type="submit"
            disabled={!form.name.trim() || isSaving}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary-500 px-3 text-sm font-semibold text-dark-950 transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
            Create Space
          </button>
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
    </main>
  );
}
