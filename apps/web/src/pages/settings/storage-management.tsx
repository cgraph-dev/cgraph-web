/**
 * StorageManagement - View and manage cached data/storage
 * Settings page for storage controls
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CircleStackIcon,
  TrashIcon,
  PhotoIcon,
  FilmIcon,
  DocumentIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { tweens, springs, entranceVariants } from '@/lib/animation-presets';
import { clearCGraphCacheStorage } from '@/lib/storage/namespaces';

interface StorageBreakdown {
  messages: number; // bytes
  images: number;
  videos: number;
  documents: number;
  cache: number;
  total: number;
}

type StorageCategoryKey = keyof Omit<StorageBreakdown, 'total'>;

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const CATEGORIES = [
  { key: 'messages', label: 'Messages', icon: ChatBubbleLeftIcon, color: 'bg-primary-500' },
  { key: 'images', label: 'Images', icon: PhotoIcon, color: 'bg-primary-400' },
  { key: 'videos', label: 'Videos', icon: FilmIcon, color: 'bg-purple-500' },
  { key: 'documents', label: 'Documents', icon: DocumentIcon, color: 'bg-orange-500' },
  { key: 'cache', label: 'Cache', icon: CircleStackIcon, color: 'bg-white/40' },
] as const satisfies readonly {
  key: StorageCategoryKey;
  label: string;
  icon: typeof ChatBubbleLeftIcon;
  color: string;
}[];

type AutoDownloadOption = 'always' | 'wifi' | 'never';
type AutoDownloadType = keyof StorageManagementAutoDownload;

interface StorageManagementAutoDownload {
  images: AutoDownloadOption;
  videos: AutoDownloadOption;
  documents: AutoDownloadOption;
}

const AUTO_DOWNLOAD_TYPES = ['images', 'videos', 'documents'] as const satisfies readonly AutoDownloadType[];
const AUTO_DOWNLOAD_OPTIONS = ['always', 'wifi', 'never'] as const satisfies readonly AutoDownloadOption[];

function getAutoDownloadOption(value: string): AutoDownloadOption | null {
  return AUTO_DOWNLOAD_OPTIONS.find((option) => option === value) ?? null;
}

export function StorageManagement() {
  const [storage, setStorage] = useState<StorageBreakdown>({
    messages: 0,
    images: 0,
    videos: 0,
    documents: 0,
    cache: 0,
    total: 0,
  });
  const [clearing, setClearing] = useState(false);
  const [autoDownload, setAutoDownload] = useState<StorageManagementAutoDownload>({
    images: 'always',
    videos: 'wifi',
    documents: 'never',
  });

  useEffect(() => {
    // Estimate storage usage from browser APIs
    const estimate = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const est = await navigator.storage.estimate();
        const used = est.usage || 0;
        // Rough breakdown (in practice you'd track per-category)
        setStorage({
          messages: Math.floor(used * 0.3),
          images: Math.floor(used * 0.35),
          videos: Math.floor(used * 0.2),
          documents: Math.floor(used * 0.05),
          cache: Math.floor(used * 0.1),
          total: used,
        });
      }
    };
    estimate();
  }, []);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      // Clear service worker cache
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }
      clearCGraphCacheStorage();

      setStorage((prev) => ({ ...prev, cache: 0, total: prev.total - prev.cache }));
    } finally {
      setClearing(false);
    }
  };

  const maxCategory = Math.max(...Object.values(storage).filter((_, i) => i < 5));

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        variants={entranceVariants.fadeUp}
        initial="initial"
        animate="animate"
        transition={springs.gentle}
        className="mb-6"
      >
        <div className="mb-2 flex items-center gap-3">
          <CircleStackIcon className="h-6 w-6 text-primary-400" />
          <h2 className="text-xl font-bold text-white">Storage & Data</h2>
        </div>
        <p className="text-sm text-white/40">Total usage: {formatBytes(storage.total)}</p>
      </motion.div>

      {/* Usage breakdown */}
      <div className="mb-8 space-y-3">
        {CATEGORIES.map((cat) => {
          const value = storage[cat.key];
          const pct = maxCategory > 0 ? (value / maxCategory) * 100 : 0;

          return (
            <div key={cat.key} className="flex items-center gap-3">
              <cat.icon className="h-5 w-5 text-white/40" />
              <div className="min-w-[80px] text-sm text-white/60">{cat.label}</div>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-[var(--token-card-bg)/0.6]">
                <motion.div
                  className={`absolute inset-y-0 left-0 rounded-full ${cat.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={tweens.emphatic}
                />
              </div>
              <span className="min-w-[60px] text-right text-xs text-white/30">
                {formatBytes(value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Clear cache */}
      <div className="aurora-social-panel mb-8 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">Clear Cache</h3>
            <p className="text-xs text-white/30">Free up space by clearing cached data</p>
          </div>
          <button
            onClick={handleClearCache}
            disabled={clearing}
            className="aurora-social-button-danger flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            {clearing ? 'Clearing...' : 'Clear'}
          </button>
        </div>
      </div>

      {/* Auto-download settings */}
      <div className="aurora-social-panel rounded-2xl p-4">
        <h3 className="mb-3 text-sm font-medium text-white">Auto-Download</h3>
        <div className="space-y-3">
          {AUTO_DOWNLOAD_TYPES.map((type) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-sm capitalize text-white/60">{type}</span>
              <select
                value={autoDownload[type]}
                onChange={(e) => {
                  const nextValue = getAutoDownloadOption(e.target.value);
                  if (!nextValue) {
                    return;
                  }

                  setAutoDownload((prev) => ({
                    ...prev,
                    [type]: nextValue,
                  }));
                }}
                className="aurora-social-select rounded-xl px-3 py-1.5 text-sm text-white outline-none"
              >
                <option value="always">Always</option>
                <option value="wifi">Wi-Fi only</option>
                <option value="never">Never</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
