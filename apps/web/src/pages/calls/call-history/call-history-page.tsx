import { motion, AnimatePresence } from 'motion/react';
import { Phone, RefreshCw } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { useCallHistory } from './hooks';
import { containerVariants } from './animations';
import CallItem from './call-item';
import type { CallFilter } from './types';

const FILTER_OPTIONS: { value: CallFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'missed', label: 'Missed' },
];

export default function CallHistoryPage() {
  const { sections, filter, setFilter, isLoading, isEmpty, error, refetch } = useCallHistory();
  const hasError = Boolean(error);

  return (
    <PageContainer title="Call History" subtitle="View and manage your recent calls" maxWidth="lg">
      {/* Filter tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-lg bg-[var(--token-bg-secondary)] p-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={filter === opt.value}
            onClick={() => setFilter(opt.value)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === opt.value
                ? 'bg-[var(--token-card-bg)] text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          className="flex items-center justify-center py-20"
          role="status"
          aria-label="Loading calls"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand-purple)] border-t-transparent" />
        </div>
      )}

      {/* Error state */}
      {!isLoading && hasError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
            <Phone className="h-10 w-10 text-red-400/70" />
          </div>
          <h3 className="text-lg font-semibold text-white/70">Call history unavailable</h3>
          <p className="mt-1 max-w-sm text-sm text-white/40">
            Your real call records could not be loaded right now.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[var(--token-bg-secondary)] px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-[var(--token-card-bg)] hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !hasError && isEmpty && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--token-bg-secondary)]">
            <Phone className="h-10 w-10 text-white/20" />
          </div>
          <h3 className="text-lg font-semibold text-white/60">No calls yet</h3>
          <p className="mt-1 text-sm text-white/40">Your call history will appear here</p>
        </div>
      )}

      {/* Call list */}
      {!isLoading && !hasError && !isEmpty && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <AnimatePresence mode="popLayout">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.calls.map((call) => (
                    <CallItem key={call.id} call={call} />
                  ))}
                </div>
              </div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </PageContainer>
  );
}
