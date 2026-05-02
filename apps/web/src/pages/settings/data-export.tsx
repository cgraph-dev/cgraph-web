/**
 * DataExport - GDPR-compliant data export page with Elite aesthetics
 * Allows users to request full data export, poll status, and download
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  UserIcon,
  PencilSquareIcon,
  Cog6ToothIcon,
  TrophyIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { springs, entranceVariants } from '@/lib/animation-presets';
import { http } from '@/lib/api-client';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { SCALE_IN, FADE_IN } from '@/lib/animations/transitions';

type ExportStatus = 'idle' | 'requesting' | 'processing' | 'ready' | 'error';

interface ExportCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  checked: boolean;
}

const DEFAULT_CATEGORIES: ExportCategory[] = [
  {
    id: 'messages',
    label: 'Messages',
    description: 'All direct and group message history',
    icon: ChatBubbleBottomCenterTextIcon,
    checked: true,
  },
  {
    id: 'profile',
    label: 'Profile Data',
    description: 'Username, bio, avatar, settings',
    icon: UserIcon,
    checked: true,
  },
  {
    id: 'posts',
    label: 'Forum Posts',
    description: 'All posts, comments, and votes',
    icon: PencilSquareIcon,
    checked: true,
  },
  {
    id: 'settings',
    label: 'Preferences',
    description: 'Theme, notification, and privacy settings',
    icon: Cog6ToothIcon,
    checked: true,
  },
  {
    id: 'gamification',
    label: 'Gamification',
    description: 'XP, achievements, quest progress, titles',
    icon: TrophyIcon,
    checked: false,
  },
  {
    id: 'media',
    label: 'Uploaded Media',
    description: 'Images, files, and attachments you shared',
    icon: FolderIcon,
    checked: false,
  },
];

/**
 * NeonIcon - Wraps an icon with a glowing neon effect
 */
function NeonIcon({ icon: Icon, active }: { icon: React.ElementType; active: boolean }) {
  return (
    <div
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${
        active
          ? 'border-primary-500/30 bg-primary-500/10 text-primary-400'
          : 'border-transparent bg-[var(--token-bg-primary)] text-white/20'
      }`}
    >
      {active && (
        <motion.div
          layoutId="icon-glow"
          className="bg-primary-500/20 absolute inset-0 rounded-xl blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
      <Icon
        className={`relative z-10 h-5 w-5 transition-colors duration-300 ${
          active ? 'text-primary-400' : 'text-white/30'
        }`}
      />
    </div>
  );
}

/**
 * NeonCheckbox - A high-end animated checkbox
 */
function NeonCheckbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-300 ${
        checked
          ? 'border-primary-500/40 bg-primary-500/20 shadow-[0_0_10px_rgba(59,130,246,0.25)]'
          : 'border-[var(--token-card-border)] bg-white/5'
      }`}
    >
      <AnimatePresence>
        {checked && (
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-primary-400"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DataExport() {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const exportIdRef = useRef<string | null>(null);

  function toggleCategory(id: string) {
    HapticFeedback.light();
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)));
  }

  const selectedCount = categories.filter((c) => c.checked).length;

  async function requestExport() {
    setStatus('requesting');
    setProgress(0);

    try {
      const selectedIds = categories.filter((c) => c.checked).map((c) => c.id);
      const response = await http.post('/api/v1/me/export', {
        categories: selectedIds,
      });

      const exportId = response.data?.export_id;
      exportIdRef.current = exportId || null;
      setStatus('processing');

      // Poll real backend export status
      if (exportId) {
        const interval = setInterval(async () => {
          try {
            const status = await http.get(`/api/v1/me/export/${exportId}`);
            const pct = status.data?.progress ?? 0;
            setProgress(pct);
            if (pct >= 100 || status.data?.status === 'ready') {
              clearInterval(interval);
              setStatus('ready');
            } else if (status.data?.status === 'error') {
              clearInterval(interval);
              setStatus('error');
            }
          } catch {
            clearInterval(interval);
            setStatus('error');
          }
        }, 2000);
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Immersive background glow */}
      <div className="bg-primary-500/5 pointer-events-none absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full blur-[120px]" />

      {/* Header */}
      <motion.div
        variants={entranceVariants.fadeUp}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        <h1 className="mb-1 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-black text-transparent">
          Data Export
        </h1>
        <p className="text-sm font-medium text-white/40">
          Securely package and download your personal data archive.
        </p>
      </motion.div>

      {/* Category Selection */}
      <motion.div
        className="aurora-social-panel relative z-10 overflow-hidden rounded-2xl p-5"
        variants={entranceVariants.fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.05 }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          Select Data to Export
        </h2>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {categories.map((cat) => (
            <motion.label
              key={cat.id}
              className={`relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
                cat.checked
                  ? 'border-primary-500/30 bg-primary-500/[0.05]'
                  : 'border-white/5 bg-[var(--token-bg-primary)/0.3] hover:bg-[var(--token-card-bg)/0.5]'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              {cat.checked && (
                <motion.div
                  layoutId={`active-glow-${cat.id}`}
                  className="bg-primary-500/[0.03] absolute inset-0 blur-xl"
                />
              )}

              <div className="flex h-full items-center justify-center">
                <NeonCheckbox checked={cat.checked} />
              </div>

              <NeonIcon icon={cat.icon} active={cat.checked} />

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-bold transition-colors duration-300 ${
                    cat.checked ? 'text-white' : 'text-white/60'
                  }`}
                >
                  {cat.label}
                </p>
                <p className="truncate text-[10px] font-medium text-white/30">{cat.description}</p>
              </div>

              <input
                type="checkbox"
                checked={cat.checked}
                onChange={() => toggleCategory(cat.id)}
                className="sr-only"
              />
            </motion.label>
          ))}
        </div>
      </motion.div>

      {/* Progress / Status */}
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.button
            key="request"
            className="aurora-social-button group relative w-full overflow-hidden rounded-xl px-6 py-4 font-black uppercase tracking-widest disabled:opacity-30"
            onClick={() => {
              HapticFeedback.medium();
              requestExport();
            }}
            disabled={selectedCount === 0}
            whileTap={{ scale: 0.88 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            <div className="flex items-center justify-center gap-2">
              <ArrowDownTrayIcon className="h-5 w-5" />
              Request Export ({selectedCount})
            </div>
          </motion.button>
        )}

        {status === 'processing' && (
          <motion.div
            key="processing"
            className="aurora-social-panel rounded-xl p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 animate-spin text-primary-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                  Encrypting Archive…
                </span>
              </div>
              <span className="font-mono text-sm font-black text-primary-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full rounded-full bg-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.45)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={springs.smooth}
              />
            </div>
          </motion.div>
        )}

        {status === 'ready' && (
          <motion.div
            key="ready"
            className="border-primary-500/30 bg-primary-500/5 rounded-xl border p-5 backdrop-blur-xl"
            {...SCALE_IN}
            exit={{ opacity: 0 }}
            transition={springs.bouncy}
          >
            <div className="flex items-center gap-4">
              <div className="bg-primary-500/10 ring-primary-500/20 flex h-12 w-12 items-center justify-center rounded-2xl text-primary-400 ring-1">
                <CheckCircleIcon className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-black tracking-tight text-primary-200">Export Ready</p>
                <p className="text-primary-300/50 text-xs font-medium">
                  Your archive is encrypted and ready.
                </p>
              </div>
              <motion.button
                className="aurora-social-button flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-black uppercase tracking-widest"
                whileTap={{ scale: 0.88 }}
                onClick={() => {
                  HapticFeedback.success();
                  if (exportIdRef.current) {
                    window.open(`/api/v1/me/export/${exportIdRef.current}/download`, '_blank');
                  }
                  setStatus('idle');
                  setProgress(0);
                }}
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Download
              </motion.button>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            className="flex items-center gap-4 rounded-xl border border-red-500/30 bg-red-500/5 p-5 backdrop-blur-xl"
            {...FADE_IN}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
              <ExclamationCircleIcon className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="font-black text-red-400">Export Synced</p>
              <p className="text-xs font-medium text-red-400/50">
                An error occurred during packaging.
              </p>
            </div>
            <button
              className="rounded-lg bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20"
              onClick={() => setStatus('idle')}
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <motion.div
        className="aurora-social-panel relative z-10 overflow-hidden rounded-xl p-6 text-[10px] text-white/30"
        {...FADE_IN}
        transition={{ delay: 0.2 }}
      >
        <p className="mb-3 text-sm font-black text-white/60">Guidelines</p>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-2 pl-2 sm:grid-cols-2">
          <li className="flex items-start gap-2">
            <span className="bg-primary-500/40 mt-1 h-1 w-1 rounded-full" />
            Archive format: ZIP (JSON)
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-primary-500/40 mt-1 h-1 w-1 rounded-full" />
            Expires after 24 hours
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-primary-500/40 mt-1 h-1 w-1 rounded-full" />
            Limit: 1 request per day
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-primary-500/40 mt-1 h-1 w-1 rounded-full" />
            Encrypted metadata preserved
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
