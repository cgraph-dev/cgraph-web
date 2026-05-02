/** Three-column media grid for chat attachments, links, and files. */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui';
import { FADE_IN } from '@/lib/animations/transitions';

type MediaTab = 'media' | 'files' | 'links' | 'voice';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'gif';
  thumbnailUrl: string;
  url: string;
  width?: number;
  height?: number;
}

interface FileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

interface LinkItem {
  id: string;
  url: string;
  title: string;
  domain: string;
  thumbnailUrl?: string;
}

interface SharedMediaGridProps {
  media?: MediaItem[];
  files?: FileItem[];
  links?: LinkItem[];
  isLoading?: boolean;
  onMediaClick?: (item: MediaItem) => void;
  onFileClick?: (item: FileItem) => void;
  onLinkClick?: (item: LinkItem) => void;
  className?: string;
}

const TABS: { key: MediaTab; label: string }[] = [
  { key: 'media', label: 'Media' },
  { key: 'files', label: 'Files' },
  { key: 'links', label: 'Links' },
];

/** Shared Media Grid component. */
export function SharedMediaGrid({
  media = [],
  files = [],
  links = [],
  isLoading = false,
  onMediaClick,
  onFileClick,
  onLinkClick,
  className,
}: SharedMediaGridProps) {
  const [activeTab, setActiveTab] = useState<MediaTab>('media');

  return (
    <div className={cn('px-3', className)}>
      {/* Tabs */}
      <div className="mb-3 flex gap-1 rounded-lg bg-[var(--token-bg-secondary)/0.3] p-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-[var(--token-card-bg)] text-white'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'media' && (
          <motion.div
            key="media"
            {...FADE_IN}
            exit={{ opacity: 0 }}
          >
            {isLoading ? (
              <div className="grid grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} shape="thumbnail" className="aspect-square" />
                ))}
              </div>
            ) : media.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-lg">
                {media.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onMediaClick?.(item)}
                    className="group relative aspect-square overflow-hidden bg-[var(--token-card-bg)/0.4]"
                  >
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <EmptyTab label="No media shared yet" />
            )}
          </motion.div>
        )}

        {activeTab === 'files' && (
          <motion.div
            key="files"
            {...FADE_IN}
            exit={{ opacity: 0 }}
            className="space-y-1"
          >
            {files.length > 0 ? (
              files.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => onFileClick?.(file)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-[var(--token-card-bg)/0.4]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--token-card-bg)/0.6] text-xs text-white/40">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-white/80">{file.name}</p>
                    <p className="text-[10px] text-white/30">{file.size}</p>
                  </div>
                </button>
              ))
            ) : (
              <EmptyTab label="No files shared yet" />
            )}
          </motion.div>
        )}

        {activeTab === 'links' && (
          <motion.div
            key="links"
            {...FADE_IN}
            exit={{ opacity: 0 }}
            className="space-y-1"
          >
            {links.length > 0 ? (
              links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onLinkClick?.(link)}
                  className="flex items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-[var(--token-card-bg)/0.4]"
                >
                  {link.thumbnailUrl ? (
                    <img src={link.thumbnailUrl} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--token-card-bg)/0.6] text-xs text-white/40">
                      🔗
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-white/80">{link.title}</p>
                    <p className="text-[10px] text-white/30">{link.domain}</p>
                  </div>
                </a>
              ))
            ) : (
              <EmptyTab label="No links shared yet" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return <p className="py-8 text-center text-xs text-white/20">{label}</p>;
}

function getFileIcon(type: string): string {
  if (type.includes('pdf')) return '📄';
  if (type.includes('zip') || type.includes('rar')) return '📦';
  if (type.includes('doc') || type.includes('text')) return '📝';
  if (type.includes('sheet') || type.includes('csv')) return '📊';
  return '📎';
}

export default SharedMediaGrid;
