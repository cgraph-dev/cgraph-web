/**
 * Forum Calendar — Public calendar view showing upcoming events for a forum.
 * Renders a month grid with event dots and an event list.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { http } from '@/modules/forums/store/forumStore.utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ForumCalendar');

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  location: string | null;
  visibility: string;
  rsvp_enabled: boolean;
  rsvp_count: number;
  max_attendees: number | null;
  author: { id: string; username: string; display_name: string } | null;
  category: { id: string; name: string; color: string } | null;
}

interface ForumCalendarProps {
  forumId: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Forum calendar component displaying events by month. */
export function ForumCalendar({ forumId }: ForumCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(async () => {
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    try {
      const response = await http.get(
        `/api/v1/forums/${forumId}/events?start_date=${startDate}&end_date=${endDate}`
      );
      setEvents(response.data?.data ?? []);
    } catch (err: unknown) {
      logger.error(err instanceof Error ? err : new Error(String(err)), 'fetchEvents');
    } finally {
      setLoading(false);
    }
  }, [forumId, year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build event map keyed by day of month
  const eventsByDay: Record<number, CalendarEvent[]> = {};
  for (const event of events) {
    const day = new Date(event.start_date).getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(event);
  }

  const selectedEvents = selectedDate
    ? events.filter((e) => {
        const eventDay = new Date(e.start_date).getDate();
        return String(eventDay) === selectedDate;
      })
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <GlassCard className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--token-text-primary)]">
          <CalendarDaysIcon className="h-5 w-5" />
          Calendar
        </h3>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevMonth}
            className="rounded p-1 text-[var(--token-text-secondary)]"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </motion.button>
          <span className="text-sm font-medium text-[var(--token-text-primary)]">
            {MONTHS[month]} {year}
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextMonth}
            className="rounded p-1 text-[var(--token-text-secondary)]"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px text-center">
        {DAYS.map((day) => (
          <div key={day} className="py-1 text-xs font-medium text-[var(--token-text-secondary)]">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="h-10" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const hasEvents = Boolean(eventsByDay[day]?.length);
          const isSelected = selectedDate === String(day);
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();

          return (
            <motion.button
              key={day}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(isSelected ? null : String(day))}
              className={`relative flex h-10 flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-primary-500 text-white'
                  : isToday
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-[var(--token-text-primary)] hover:bg-[var(--token-bg-secondary)]'
              }`}
            >
              {day}
              {hasEvents && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {(eventsByDay[day] ?? []).slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: event.category?.color ?? '#8B5CF6' }}
                    />
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected day events */}
      {selectedDate && selectedEvents.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-[var(--token-card-border)] pt-4">
          <h4 className="text-sm font-medium text-[var(--token-text-secondary)]">
            Events on {MONTHS[month]} {selectedDate}
          </h4>
          {selectedEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] p-3"
            >
              <div className="flex items-center gap-2">
                {event.category && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: event.category.color }}
                  />
                )}
                <span className="font-medium text-[var(--token-text-primary)]">{event.title}</span>
                {!event.all_day && (
                  <span className="text-xs text-[var(--token-text-secondary)]">
                    {formatTime(event.start_date)}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="mt-1 line-clamp-2 text-xs text-[var(--token-text-secondary)]">
                  {event.description}
                </p>
              )}
              <div className="mt-1 flex items-center gap-3 text-xs text-[var(--token-text-secondary)]">
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-3 w-3" />
                    {event.location}
                  </span>
                )}
                {event.rsvp_enabled && (
                  <span className="flex items-center gap-1">
                    <UserGroupIcon className="h-3 w-3" />
                    {event.rsvp_count} going
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {events.length === 0 && (
        <p className="mt-4 text-center text-sm text-[var(--token-text-secondary)]">
          No events this month
        </p>
      )}
    </GlassCard>
  );
}
