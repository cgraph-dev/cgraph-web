/**
 * Events Management Panel
 * Create, manage, and monitor events — backed by real API
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('EventsManagement');

import { eventsApi, type AdminEvent } from '../../api/eventsApi';
import type { CreateEventModalProps } from './types';
import { STATUS_COLORS, EVENT_FILTERS } from './constants';
import { FADE_IN, FADE_UP } from '@/lib/animations/transitions';

/**
 * Modal for creating new events
 */
function CreateEventModal({ onClose, onSubmit }: CreateEventModalProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('draft');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), status });
  };

  return (
    <motion.div
      {...FADE_IN}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-bold">Create New Event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-400">Event Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--token-border-muted)] bg-white/5 px-4 py-2 focus:border-purple-500 focus:outline-none"
              placeholder="Enter event name..."
              autoFocus
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-[var(--token-border-muted)] bg-white/5 px-4 py-2 focus:border-purple-500 focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-white/5 px-4 py-2 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 font-medium transition-opacity hover:opacity-90"
            >
              Create Event
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function EventsManagement() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchEvents() {
    setLoading(true);
    setError(null);
    try {
      const result = await eventsApi.listEvents();
      setEvents(result.events);
    } catch (err) {
      logger.error('Failed to fetch events', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'All') return events;
    return events.filter((e) => e.status === activeFilter.toLowerCase());
  }, [events, activeFilter]);

  async function handleAddEvent(params: { name: string; status: string }) {
    try {
      const created = await eventsApi.createEvent(params);
      setEvents((prev) => [...prev, created]);
      setShowCreateModal(false);
    } catch (err) {
      logger.error('Failed to create event', err);
    }
  }

  return (
    <motion.div
      {...FADE_UP}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Events Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-medium transition-opacity hover:opacity-90"
        >
          + Create Event
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
          <button onClick={fetchEvents} className="ml-4 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      <div className="mb-6 flex gap-4">
        {EVENT_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              activeFilter === filter ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--token-border-muted)] bg-white/5">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            Loading events...
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-[var(--token-border-muted)]">
              <tr className="text-left text-sm text-gray-500">
                <th className="p-4">Event Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Participants</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No events found
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-white/5">
                    <td className="p-4 font-medium">{event.name}</td>
                    <td className="p-4">
                      <span
                        className={`rounded px-2 py-1 text-xs ${STATUS_COLORS[event.status] || 'bg-gray-500/20 text-gray-400'}`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{event.participants.toLocaleString()}</td>
                    <td className="p-4">
                      <button className="rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateEventModal onClose={() => setShowCreateModal(false)} onSubmit={handleAddEvent} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
