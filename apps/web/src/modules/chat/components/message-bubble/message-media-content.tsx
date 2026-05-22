/**
 * Message Media Content
 *
 * Renders the appropriate media content for a message based on its type.
 * Handles image, video, file, voice/audio, and GIF message types.
 *
 * Web is not a Signal-participant device (ADR-022): encrypted DM media is
 * rendered only on mobile/desktop. In the browser we handle plaintext media
 * from forums, hubs, broadcasts, and group chats.
 */

import { useState } from 'react';
import { VoiceMessagePlayer } from '@/components/media/voice-message-player';
import AdvancedVoiceVisualizer from '@/modules/chat/components/audio/advanced-voice-visualizer';
import { GifMessage } from '@/modules/chat/components/gif-message';
import { FileMessage } from '@/modules/chat/components/file-message';
import { FileIcon } from './icons';
import { mapVisualizerTheme } from './utils';
import { toast } from '@/shared/components/ui';
import { http } from '@/lib/api-client';
import { LockClosedIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';

import { ContactCardMessage } from '@/modules/chat/components/contact-card-message';
import type { ContactCardData } from '@cgraph/shared-types';
import type { Message } from '@/modules/chat/store/chatStore.impl';
import type { UIPreferences } from './types';

interface MessageMediaContentProps {
  message: Message;
  isOwn: boolean;
  voiceVisualizerTheme: UIPreferences['voiceVisualizerTheme'];
}

/** Safely extract a string from an unknown metadata value. */
function metaString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Safely extract a number from an unknown metadata value. */
function metaNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

/** Safely extract a number[] from an unknown metadata value. */
function metaNumberArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  if (value.every((v) => typeof v === 'number')) return value;
  return undefined;
}

/**
 * Voice media sub-component.
 *
 * Renders plaintext voice metadata (waveform + duration). Encrypted voice
 * metadata is never decrypted in the browser — if the server delivers
 * encrypted fields, we display a lock-state fallback and the user must open
 * the conversation on mobile/desktop.
 */
function VoiceMediaContent({ message, isOwn, voiceVisualizerTheme }: MessageMediaContentProps) {
  if (message.metadata?.is_metadata_encrypted === true) {
    return (
      <div className="flex min-w-[280px] items-center gap-2 rounded-xl bg-[var(--token-card-bg)] px-4 py-3 text-sm text-[var(--token-text-muted)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
            clipRule="evenodd"
          />
        </svg>
        <span>Encrypted voice message — open on mobile or desktop</span>
      </div>
    );
  }

  const audioUrl = metaString(message.metadata?.url) ?? '';
  const waveform = metaNumberArray(message.metadata?.waveform) ?? [];
  const duration = metaNumber(message.metadata?.duration) ?? 0;

  return (
    <div className="min-w-[280px] space-y-2">
      <AdvancedVoiceVisualizer
        audioUrl={audioUrl}
        variant="spectrum"
        theme={mapVisualizerTheme(voiceVisualizerTheme)}
        height={120}
        width={280}
        className="rounded-xl"
      />
      <VoiceMessagePlayer
        messageId={message.id}
        audioUrl={audioUrl}
        duration={duration}
        waveformData={waveform}
        className={isOwn ? 'voice-player-own' : ''}
      />
    </div>
  );
}

interface LockedFileOverlayProps {
  readonly message: Message;
  readonly nodesPrice: number;
}

/**
 * Blurred overlay shown on Node-locked file attachments.
 *
 * Displays a blurred thumbnail with a lock icon, price badge, and
 * "Unlock" button. Calls PUT /api/v1/paid-dm/:fileId/unlock on click.
 */
function LockedFileOverlay({ message, nodesPrice }: LockedFileOverlayProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLocked, setIsLocked] = useState(true);

  const metaUrl = metaString(message.metadata?.url);
  const filename = metaString(message.metadata?.filename) ?? 'File';

  async function handleUnlock(): Promise<void> {
    setIsUnlocking(true);
    try {
      const paidFileId =
        metaString(message.metadata?.paid_dm_file_id) ?? metaString(message.metadata?.paidDmFileId);

      if (!paidFileId) {
        throw new Error('Missing paid file id');
      }

      await http.put(`/api/v1/paid-dm/${paidFileId}/unlock`, { message_id: message.id });
      setIsLocked(false);
      toast.success(`File unlocked for ${nodesPrice} Nodes`);
    } catch {
      toast.error('Failed to unlock file. Check your Node balance.');
    } finally {
      setIsUnlocking(false);
    }
  }

  // After unlocking, render the file normally
  if (!isLocked && metaUrl) {
    return (
      <a
        href={metaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2 flex items-center gap-2 rounded-lg bg-[var(--token-card-bg)] p-2 transition-colors hover:bg-[var(--token-card-bg)/0.8]"
      >
        <FileIcon />
        <span className="truncate text-sm">{filename}</span>
      </a>
    );
  }

  return (
    <div className="relative mb-2 overflow-hidden rounded-lg border border-dark-700 bg-dark-800">
      {/* Blurred preview area */}
      <div
        className="flex h-36 items-center justify-center bg-dark-900"
        style={{ filter: 'blur(10px)', WebkitFilter: 'blur(10px)' }}
      >
        {metaUrl ? (
          <img src={metaUrl} alt="" className="h-full w-full object-cover" aria-hidden="true" />
        ) : (
          <FileIcon />
        )}
      </div>

      {/* Overlay content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
        <LockClosedIcon className="h-8 w-8 text-amber-400" />

        {/* Price badge */}
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-400">
          <CurrencyDollarIcon className="h-4 w-4" />
          {nodesPrice} Nodes
        </span>

        <button
          type="button"
          disabled={isUnlocking}
          onClick={handleUnlock}
          className="rounded-md bg-amber-500 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          {isUnlocking ? 'Unlocking…' : `Unlock for ${nodesPrice} Nodes`}
        </button>
      </div>

      {/* Filename bar */}
      <div className="flex items-center gap-2 px-3 py-2">
        <FileIcon />
        <span className="truncate text-sm text-gray-400">{filename}</span>
      </div>
    </div>
  );
}

function isFileLocked(message: Message): boolean {
  return (
    (message.metadata?.is_file_locked === true || message.metadata?.isFileLocked === true) &&
    (metaNumber(message.metadata?.nodes_price) !== undefined ||
      metaNumber(message.metadata?.nodesPrice) !== undefined)
  );
}

function getNodesPrice(message: Message): number {
  return metaNumber(message.metadata?.nodes_price) ?? metaNumber(message.metadata?.nodesPrice) ?? 0;
}

/**
 * Render the media body of a message based on its type.
 */
export function MessageMediaContent({
  message,
  isOwn,
  voiceVisualizerTheme,
}: MessageMediaContentProps) {
  const metaUrl = metaString(message.metadata?.url);

  if (!isOwn && isFileLocked(message)) {
    return <LockedFileOverlay message={message} nodesPrice={getNodesPrice(message)} />;
  }

  if (message.messageType === 'image' && metaUrl !== undefined) {
    return (
      <img
        src={metaUrl}
        alt="Shared image"
        className="mb-2 max-w-xs cursor-pointer rounded-lg transition-opacity hover:opacity-90"
        onClick={() => window.open(metaUrl, '_blank')}
      />
    );
  }

  if (message.messageType === 'video' && metaUrl !== undefined) {
    return <video src={metaUrl} controls className="mb-2 max-w-xs rounded-lg" />;
  }

  if (message.messageType === 'file' && metaUrl !== undefined) {
    const filename = metaString(message.metadata?.filename) ?? 'File';
    return (
      <>
        <a
          href={metaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 flex items-center gap-2 rounded-lg bg-[var(--token-card-bg)] p-2 transition-colors hover:bg-[var(--token-card-bg)/0.8]"
        >
          <FileIcon />
          <span className="truncate text-sm">{filename}</span>
        </a>
        <FileMessage message={message} isOwnMessage={isOwn} className="mb-2" />
      </>
    );
  }

  if (
    (message.messageType === 'voice' || message.messageType === 'audio') &&
    message.metadata?.url !== undefined
  ) {
    return (
      <VoiceMediaContent
        message={message}
        isOwn={isOwn}
        voiceVisualizerTheme={voiceVisualizerTheme}
      />
    );
  }

  if (message.messageType === 'gif') {
    return <GifMessage message={message} isOwnMessage={isOwn} className="mb-2" />;
  }

  if (message.messageType === 'contact' && message.linkPreview?.firstName) {
    const contactData: ContactCardData = {
      firstName: message.linkPreview.firstName,
      lastName: message.linkPreview.lastName,
      phoneNumber: message.linkPreview.phoneNumber,
      username: message.linkPreview.username,
      userId: message.linkPreview.userId,
      avatarUrl: message.linkPreview.avatarUrl,
    };
    return <ContactCardMessage contactData={contactData} className="mb-2" />;
  }

  return null;
}
