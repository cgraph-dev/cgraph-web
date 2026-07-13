/**
 * File attachment message component.
 *
 * Web renders plaintext file attachments from forums, hubs, broadcasts, group
 * chats, and Cloud DMs. Secret Chat encrypted files are not decrypted here
 * (ADR-022) — that surface is mobile/desktop-only.
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { formatBytes } from '@/lib/utils';
import type { Message } from '@/modules/chat/store/chatStore.impl';
import { SCALE_IN } from '@/lib/animations/transitions';

interface FileMessageProps {
  message: Message;
  isOwnMessage: boolean;
  className?: string;
}

/** Safely extract a string metadata field. */
function metaStr(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Safely extract a number metadata field. */
function metaNum(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

/**
 * FileMessage Component
 *
 * Displays file attachments in messages with:
 * - File type icons and previews
 * - Download functionality
 * - Image thumbnails for image files
 * - File metadata (name, size, type)
 */
export function FileMessage({ message, isOwnMessage, className = '' }: FileMessageProps) {
  const [imageError, setImageError] = useState(false);

  // Extract file metadata from message with safe type helpers
  const fileUrl =
    metaStr(message.metadata?.fileUrl) ??
    metaStr(message.metadata?.file_url) ??
    metaStr(message.metadata?.url);
  const fileName =
    metaStr(message.metadata?.fileName) ??
    metaStr(message.metadata?.file_name) ??
    metaStr(message.metadata?.filename) ??
    'Unknown file';
  const fileSize =
    metaNum(message.metadata?.fileSize) ??
    metaNum(message.metadata?.file_size) ??
    metaNum(message.metadata?.size) ??
    0;
  const fileMimeType =
    metaStr(message.metadata?.fileMimeType) ??
    metaStr(message.metadata?.file_mime_type) ??
    metaStr(message.metadata?.mimeType) ??
    metaStr(message.metadata?.mime_type) ??
    '';
  const thumbnailUrl =
    metaStr(message.metadata?.thumbnailUrl) ?? metaStr(message.metadata?.thumbnail_url);

  if (!fileUrl) {
    return null;
  }

  // Determine file type category
  const isImage = fileMimeType.startsWith('image/');
  const isVideo = fileMimeType.startsWith('video/');
  const isAudio = fileMimeType.startsWith('audio/');
  const isDocument = fileMimeType.includes('pdf') || fileMimeType.includes('document');

  // Get appropriate icon
  const getFileIcon = () => {
    if (isImage) return <PhotoIcon className="h-8 w-8" />;
    if (isVideo) return <VideoCameraIcon className="h-8 w-8" />;
    if (isAudio) return <MusicalNoteIcon className="h-8 w-8" />;
    if (isDocument) return <DocumentTextIcon className="h-8 w-8" />;
    return <DocumentIcon className="h-8 w-8" />;
  };

  // Get file extension
  const getFileExtension = (filename: string) => {
    const parts = filename.split('.');
    return parts.length > 1 ? (parts[parts.length - 1] ?? '').toUpperCase() : '';
  };

  /** Trigger a browser download of the plaintext file. */
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={className}>
      {/* Image Preview */}
      {isImage && !imageError && (thumbnailUrl || fileUrl) ? (
        <motion.div {...SCALE_IN} className="group relative max-w-sm overflow-hidden rounded-lg">
          <img
            src={thumbnailUrl || fileUrl}
            alt={fileName}
            onError={() => setImageError(true)}
            className="max-h-96 w-full object-contain"
            loading="lazy"
          />
          {/* Download overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <motion.button
              whileHover={{ opacity: 0.9 }}
              onClick={handleDownload}
              className="rounded-full bg-white/20 p-3 backdrop-blur-sm hover:bg-white/30"
            >
              <ArrowDownTrayIcon className="h-6 w-6 text-white" />
            </motion.button>
          </div>
        </motion.div>
      ) : (
        /* Generic File Card */
        <motion.div
          {...SCALE_IN}
          className={`group relative flex min-w-[280px] max-w-sm items-center gap-3 rounded-xl border p-4 transition-colors ${
            isOwnMessage
              ? 'border-primary-500/30 bg-primary-500/10 hover:border-primary-500/50'
              : 'border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] hover:border-[var(--token-card-border)]'
          }`}
        >
          {/* File Icon */}
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
              isImage
                ? 'bg-blue-500/20 text-blue-400'
                : isVideo
                  ? 'bg-purple-500/20 text-purple-400'
                  : isAudio
                    ? 'bg-pink-500/20 text-pink-400'
                    : isDocument
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {getFileIcon()}
          </div>

          {/* File Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white" title={fileName}>
              {fileName}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{formatBytes(fileSize)}</span>
              {getFileExtension(fileName) && (
                <>
                  <span>•</span>
                  <span>{getFileExtension(fileName)}</span>
                </>
              )}
            </div>
          </div>

          {/* Download Button */}
          <motion.button
            whileHover={{ opacity: 0.9 }}
            onClick={handleDownload}
            className={`flex-shrink-0 rounded-lg p-2 transition-colors ${
              isOwnMessage
                ? 'hover:bg-primary-500/20 text-primary-400'
                : 'text-gray-400 hover:bg-[var(--token-card-bg)/0.6]'
            }`}
            title="Download file"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
