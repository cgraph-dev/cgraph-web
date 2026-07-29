import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Folder,
  MessagesSquare,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CountBadge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button, IconButton } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import Skeleton from '@/components/ui/skeleton';
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
    <main className="cgraph-workspace flex h-full min-h-0 flex-1" aria-label="Spaces">
      <aside
        className={`cgraph-pane h-full w-full shrink-0 flex-col md:w-80 ${
          spaceId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="cgraph-pane-header flex flex-col justify-center px-4">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--token-text-primary)]">
            <Folder className="h-5 w-5 text-[var(--token-interactive-primary)]" />
            Spaces
          </h1>
          <p className="mt-0.5 text-xs text-[var(--token-text-muted)]">
            Focused conversation lists
          </p>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-3" aria-label="Space list">
          <NavLink
            to="/spaces"
            end
            className="cgraph-list-row mb-1 flex items-center gap-3 px-3 py-2 text-sm"
          >
            <MessagesSquare className="h-5 w-5" />
            All conversations
          </NavLink>

          {spaces.map((space) => (
            <NavLink
              key={space.id}
              to={`/spaces/${space.id}`}
              className="cgraph-list-row mb-1 flex items-center gap-3 px-3 py-2 text-sm"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--product-surface-recessed)] text-base">
                {space.emoji || <Folder className="h-4 w-4" />}
              </span>
              <span className="truncate font-medium">{space.name}</span>
            </NavLink>
          ))}
        </nav>

        <form
          onSubmit={handleSaveSpace}
          className="border-t border-[var(--product-line)] p-4"
          aria-label={editingSpace ? 'Edit Space' : 'Create Space'}
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--token-text-primary)]">
            {editingSpace ? (
              <Pencil className="h-4 w-4 text-[var(--token-interactive-primary)]" />
            ) : (
              <Plus className="h-4 w-4 text-[var(--token-interactive-primary)]" />
            )}
            {editingSpace ? 'Edit Space' : 'New Space'}
          </div>
          <div className="flex gap-2">
            <Input
              value={form.emoji}
              onChange={(event) => setForm((state) => ({ ...state, emoji: event.target.value }))}
              className="w-14 px-2 text-center"
              placeholder="Icon"
              aria-label="Space icon"
              maxLength={8}
              fullWidth={false}
              disabled={isSaving}
            />
            <Input
              value={form.name}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
              placeholder="Space name"
              aria-label="Space name"
              maxLength={64}
              disabled={isSaving}
            />
          </div>

          <div className="mt-3">
            <SpaceFilterEditor
              includeAllIndividual={form.includeAllIndividual}
              includeAllGroups={form.includeAllGroups}
              showOnlyUnread={form.showOnlyUnread}
              showMuted={form.showMuted}
              onIncludeAllIndividualChange={(value) =>
                setForm((state) => ({ ...state, includeAllIndividual: value }))
              }
              onIncludeAllGroupsChange={(value) =>
                setForm((state) => ({ ...state, includeAllGroups: value }))
              }
              onShowOnlyUnreadChange={(value) =>
                setForm((state) => ({ ...state, showOnlyUnread: value }))
              }
              onShowMutedChange={(value) => setForm((state) => ({ ...state, showMuted: value }))}
              disabled={isSaving}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              type="submit"
              disabled={!form.name.trim() || isSaving}
              isLoading={isSaving}
              fullWidth
              animated={false}
              className="col-span-2"
              leftIcon={editingSpace ? <Pencil /> : <Plus />}
            >
              {editingSpace ? 'Save changes' : 'Create Space'}
            </Button>
            {editingSpace && (
              <Button
                type="button"
                onClick={cancelEditingSpace}
                disabled={isSaving}
                variant="ghost"
                animated={false}
                className="col-span-2"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </aside>

      <section
        className={`${spaceId ? 'flex' : 'hidden md:flex'} cgraph-workspace min-w-0 flex-1 flex-col overflow-y-auto`}
        aria-label="Space conversations"
      >
        <div className="cgraph-content cgraph-page-header">
          <div className="min-w-0">
            <div className="mb-3 md:hidden">
              <IconButton
                icon={<ChevronLeft />}
                label="Back to Spaces"
                onClick={() => navigate('/spaces')}
              />
            </div>
            <p className="cgraph-eyebrow flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {selectedSpace ? 'Selected Space' : 'All Spaces'}
            </p>
            <h2 className="text-2xl font-semibold text-[var(--token-text-primary)]">
              {selectedSpace ? selectedSpace.name : 'All conversations'}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--token-text-muted)]">
              {selectedSpace
                ? 'This routed Space applies its server-owned filter rules to your conversation list.'
                : 'Pick or create a Space to focus the conversation list.'}
            </p>
          </div>
          {selectedSpace && (
            <div className="flex items-center gap-2">
              <IconButton
                icon={<Pencil />}
                label={`Edit ${selectedSpace.name}`}
                onClick={() => startEditingSpace(selectedSpace)}
              />
              <IconButton
                icon={<Trash2 />}
                label={`Delete ${selectedSpace.name}`}
                variant="danger"
                onClick={() => setSpacePendingDelete(selectedSpace)}
              />
            </div>
          )}
        </div>

        <div className="cgraph-content pt-0">
          {error && (
            <Alert variant="error" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-2" role="status" aria-label="Loading Spaces">
              <span className="sr-only">Loading Spaces</span>
              <Skeleton shape="card" count={4} />
            </div>
          ) : visibleConversations.length === 0 ? (
            <EmptyState
              icon={<MessagesSquare className="h-7 w-7" />}
              title="No conversations here"
              message="No conversations match this Space."
            />
          ) : (
            <div className="grid gap-2">
              {visibleConversations.map((conversation) => (
                <NavLink
                  key={conversation.id}
                  to={`/messages/${conversation.id}`}
                  className="cgraph-list-row flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--token-text-primary)]">
                      {getConversationName(conversation, user?.id ?? '')}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--token-text-muted)]">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <CountBadge count={conversation.unreadCount} />
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>
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
            <Button
              type="button"
              onClick={() => setSpacePendingDelete(null)}
              disabled={isDeleting}
              variant="ghost"
              animated={false}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void deleteSpace()}
              disabled={isDeleting}
              variant="danger"
              animated={false}
              isLoading={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Space'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
