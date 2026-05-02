import { useState } from 'react';
import { http } from '@/lib/api-client';

interface DripScheduleItem {
  readonly section_index: number;
  readonly available_at: string;
}

interface DripEditorProps {
  readonly premiumThreadId: string;
  readonly initialSchedule: DripScheduleItem[] | null;
  readonly sectionCount: number;
  readonly onSaved?: (schedule: DripScheduleItem[] | null) => void;
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function buildDefaultSchedule(count: number): DripScheduleItem[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    section_index: i,
    available_at: new Date(now + i * MS_PER_WEEK).toISOString(),
  }));
}

/** Editor for setting per-section unlock dates on premium thread content. */
export default function DripEditor({
  premiumThreadId,
  initialSchedule,
  sectionCount,
  onSaved,
}: DripEditorProps) {
  const [enabled, setEnabled] = useState(initialSchedule !== null && initialSchedule.length > 0);
  const [schedule, setSchedule] = useState<DripScheduleItem[]>(
    initialSchedule ?? buildDefaultSchedule(sectionCount)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDateChange(index: number, value: string) {
    setSchedule((prev) =>
      prev.map((item) =>
        item.section_index === index
          ? { ...item, available_at: new Date(value).toISOString() }
          : item
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      if (enabled) {
        await http.put(`/api/v1/premium-threads/${premiumThreadId}/drip`, {
          schedule,
        });
        onSaved?.(schedule);
      } else {
        await http.delete(`/api/v1/premium-threads/${premiumThreadId}/drip`);
        onSaved?.(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-border space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Drip Schedule</h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="border-border rounded"
          />
          Enable drip content
        </label>
      </div>

      {enabled && (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Set unlock dates for each section. Subscribers will see a countdown for locked sections.
          </p>
          {schedule.map((item) => (
            <div key={item.section_index} className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium">Section {item.section_index + 1}</span>
              <input
                type="datetime-local"
                value={item.available_at.slice(0, 16)}
                onChange={(e) => handleDateChange(item.section_index, e.target.value)}
                className="border-border bg-background rounded-md border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="hover:bg-primary/90 rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Schedule'}
      </button>
    </div>
  );
}
