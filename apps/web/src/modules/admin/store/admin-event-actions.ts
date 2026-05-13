/**
 * Admin Event Actions
 *
 * Event fetch, filter, create, update, delete, and status change actions.
 *
 */

import { createLogger } from '@/lib/logger';
import { ensureArray, ensureObject } from '@/lib/api-utils';
import type { AdminStore, AdminEvent, EventStatus } from './adminStore.types';

const logger = createLogger('AdminEvents');

/** Guardrail so a large event history doesn't balloon client memory. */
const MAX_ADMIN_EVENTS = 500;

type Set = (
  partial: Partial<AdminStore> | ((state: AdminStore) => Partial<AdminStore>),
  replace?: false
) => void;
type Get = () => AdminStore;

/**
 */
/**
 * Creates a new event actions.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createEventActions(set: Set, get: Get) {
  return {
    fetchEvents: async () => {
      set({ isLoading: true, error: null });
      try {
        const { api: http } = await import('@/lib/api');
        const response = await http.get('/api/v1/admin/events');
        const events = ensureArray<AdminEvent>(response.data, 'data');
        const normalized = events.slice(0, MAX_ADMIN_EVENTS).map((event) => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
        }));
        set({
          events: normalized,
          isLoading: false,
        });
      } catch (error) {
        logger.error('Failed to load events', error);
        set({
          error: 'Failed to load events',
          isLoading: false,
        });
      }
    },

    setEventFilters: (filters: Parameters<AdminStore['setEventFilters']>[0]) =>
      set((state) => ({
        eventFilters: { ...state.eventFilters, ...filters },
      })),

    createEvent: async (event: Omit<AdminEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
      set({ isLoading: true });
      try {
        const { api: http } = await import('@/lib/api');
        const response = await http.post<AdminEvent>('/api/v1/admin/events', event);

        const newEvent = ensureObject<AdminEvent>(response.data, 'data') ?? response.data;
        set((state) => ({
          events: [
            ...state.events,
            {
              ...newEvent,
              startDate: new Date(newEvent.startDate),
              endDate: new Date(newEvent.endDate),
              createdAt: new Date(newEvent.createdAt),
              updatedAt: new Date(newEvent.updatedAt),
            },
          ],
          isLoading: false,
        }));
      } catch (error) {
        logger.error('Failed to create event', error);
        set({ isLoading: false, error: 'Failed to create event' });
      }
    },

    updateEvent: async (id: string, updates: Partial<AdminEvent>) => {
      set({ isLoading: true });
      try {
        const { api: http } = await import('@/lib/api');
        await http.patch(`/api/v1/admin/events/${id}`, updates);
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updates, updatedAt: new Date() } : event
          ),
          isLoading: false,
        }));
      } catch (error) {
        logger.error(`Failed to update event: ${id}`, error);
        set({ isLoading: false, error: 'Failed to update event' });
      }
    },

    deleteEvent: async (id: string) => {
      set({ isLoading: true });
      try {
        const { api: http } = await import('@/lib/api');
        await http.delete(`/api/v1/admin/events/${id}`);
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
          isLoading: false,
        }));
      } catch (error) {
        logger.error(`Failed to delete event: ${id}`, error);
        set({ isLoading: false, error: 'Failed to delete event' });
      }
    },

    changeEventStatus: async (id: string, status: EventStatus) => {
      await get().updateEvent(id, { status });
    },
  };
}
