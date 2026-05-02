/**
 * Calendar Manager Panel — Admin panel for managing forum calendar events.
 * CRUD for events with date picker, RSVP toggle, category assignment.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { http } from '@/modules/forums/store/forumStore.utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CalendarManager');

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  timezone: string;
  event_type: string;
  is_recurring: boolean;
  location: string | null;
  location_url: string | null;
  visibility: string;
  rsvp_enabled: boolean;
  max_attendees: number | null;
  rsvp_count: number;
  author: { id: string; username: string; display_name: string } | null;
  category: { id: string; name: string; color: string } | null;
}

interface CalendarManagerPanelProps {
  forumId: string;
}

interface EventForm {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  location: string;
  location_url: string;
  visibility: string;
  rsvp_enabled: boolean;
  max_attendees: string;
}

const EMPTY_FORM: EventForm = {
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  all_day: false,
  location: '',
  location_url: '',
  visibility: 'public',
  rsvp_enabled: false,
  max_attendees: '',
};

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'members_only', label: 'Members Only' },
  { value: 'private', label: 'Private' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Admin panel for creating and managing forum calendar events. */
export function CalendarManagerPanel({ forumId }: CalendarManagerPanelProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await http.get(`/api/v1/forums/${forumId}/events`);
      setEvents(response.data?.data ?? []);
    } catch (err: unknown) {
      logger.error(err instanceof Error ? err : new Error(String(err)), 'fetchEvents');
    } finally {
      setLoading(false);
    }
  }, [forumId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setError(null);
  }

  function startEdit(event: CalendarEvent) {
    setForm({
      title: event.title,
      description: event.description ?? '',
      start_date: event.start_date ? event.start_date.slice(0, 16) : '',
      end_date: event.end_date ? event.end_date.slice(0, 16) : '',
      all_day: event.all_day,
      location: event.location ?? '',
      location_url: event.location_url ?? '',
      visibility: event.visibility,
      rsvp_enabled: event.rsvp_enabled,
      max_attendees: event.max_attendees ? String(event.max_attendees) : '',
    });
    setEditingId(event.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSave() {
    setError(null);
    const payload = {
      title: form.title,
      description: form.description || null,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      all_day: form.all_day,
      location: form.location || null,
      location_url: form.location_url || null,
      visibility: form.visibility,
      rsvp_enabled: form.rsvp_enabled,
      max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
    };

    try {
      if (editingId) {
        await http.put(`/api/v1/forums/${forumId}/events/${editingId}`, payload);
      } else {
        await http.post(`/api/v1/forums/${forumId}/events`, payload);
      }
      resetForm();
      await fetchEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save event';
      setError(message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await http.delete(`/api/v1/forums/${forumId}/events/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: unknown) {
      logger.error(err instanceof Error ? err : new Error(String(err)), 'deleteEvent');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--token-text-primary)]">Calendar & Events</h2>
          <p className="text-sm text-[var(--token-text-secondary)]">
            Manage forum events and calendar
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
        >
          <PlusIcon className="h-4 w-4" />
          Create Event
        </motion.button>
      </div>

      {/* Event Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="space-y-4 p-4">
              <h3 className="font-semibold text-[var(--token-text-primary)]">
                {editingId ? 'Edit Event' : 'New Event'}
              </h3>

              {error && (
                <div className="rounded-lg border border-red-500 bg-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Event title"
                  className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Event description"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                    Location
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Event location"
                    className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                    Location URL
                  </label>
                  <input
                    value={form.location_url}
                    onChange={(e) => setForm((f) => ({ ...f, location_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                    Visibility
                  </label>
                  <select
                    value={form.visibility}
                    onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                  >
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--token-text-secondary)]">
                    Max Attendees
                  </label>
                  <input
                    type="number"
                    value={form.max_attendees}
                    onChange={(e) => setForm((f) => ({ ...f, max_attendees: e.target.value }))}
                    placeholder="Unlimited"
                    min={0}
                    className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-sm text-[var(--token-text-primary)]"
                  />
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <label className="flex items-center gap-2 text-sm text-[var(--token-text-secondary)]">
                    <input
                      type="checkbox"
                      checked={form.all_day}
                      onChange={(e) => setForm((f) => ({ ...f, all_day: e.target.checked }))}
                      className="rounded"
                    />
                    All day
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[var(--token-text-secondary)]">
                    <input
                      type="checkbox"
                      checked={form.rsvp_enabled}
                      onChange={(e) => setForm((f) => ({ ...f, rsvp_enabled: e.target.checked }))}
                      className="rounded"
                    />
                    RSVP
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="flex items-center gap-1 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
                >
                  <CheckIcon className="h-4 w-4" />
                  {editingId ? 'Update' : 'Create'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetForm}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-[var(--token-text-secondary)]"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List */}
      <div className="space-y-2">
        {events.length === 0 && !showForm && (
          <GlassCard className="p-6 text-center">
            <CalendarDaysIcon className="mx-auto mb-2 h-8 w-8 text-[var(--token-text-secondary)]" />
            <p className="text-sm text-[var(--token-text-secondary)]">
              No events yet. Click &quot;Create Event&quot; to add one.
            </p>
          </GlassCard>
        )}

        {events.map((event) => (
          <GlassCard key={event.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-[var(--token-text-primary)]">{event.title}</h3>
                  {event.category && (
                    <span
                      className="rounded px-1.5 py-0.5 text-xs text-white"
                      style={{ backgroundColor: event.category.color }}
                    >
                      {event.category.name}
                    </span>
                  )}
                  <span className="rounded bg-[var(--token-bg-secondary)] px-1.5 py-0.5 text-xs text-[var(--token-text-secondary)]">
                    {event.visibility}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--token-text-secondary)]">
                  <span className="flex items-center gap-1">
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    {formatDate(event.start_date)}
                    {event.end_date && ` — ${formatDate(event.end_date)}`}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="h-3.5 w-3.5" />
                      {event.location}
                    </span>
                  )}
                  {event.rsvp_enabled && (
                    <span className="flex items-center gap-1">
                      <UserGroupIcon className="h-3.5 w-3.5" />
                      {event.rsvp_count} attending
                      {event.max_attendees && ` / ${event.max_attendees}`}
                    </span>
                  )}
                </div>

                {event.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--token-text-secondary)]">
                    {event.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => startEdit(event)}
                  className="rounded-lg p-1.5 text-[var(--token-text-secondary)]"
                  title="Edit"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(event.id)}
                  className="rounded-lg p-1.5 text-red-400"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
}
