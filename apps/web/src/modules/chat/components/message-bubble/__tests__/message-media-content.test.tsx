/** @module MessageMediaContent tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MessageMediaContent } from '../message-media-content';
import type { Message } from '@/modules/chat/store/chatStore.impl';

const { mockNavigate, mockUnlockFile, mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUnlockFile: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    paidDms: {
      unlockFile: mockUnlockFile,
    },
  },
}));

vi.mock('@/shared/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/components/ui')>();
  return {
    ...actual,
    toast: {
      error: mockToastError,
      success: mockToastSuccess,
    },
  };
});

vi.mock('@/components/media/voice-message-player', () => ({
  VoiceMessagePlayer: (props: Record<string, unknown>) => (
    <div data-testid="voice-player" data-message-id={props.messageId as string} />
  ),
}));

vi.mock('@/modules/chat/components/audio/advanced-voice-visualizer', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    <div data-testid="voice-visualizer" data-url={props.audioUrl as string} />
  ),
}));

vi.mock('@/modules/chat/components/gif-message', () => ({
  GifMessage: () => <div data-testid="gif-message" />,
}));

vi.mock('@/modules/chat/components/file-message', () => ({
  FileMessage: () => <div data-testid="file-message" />,
}));

vi.mock('./icons', () => ({
  FileIcon: () => <span data-testid="file-icon" />,
}));

vi.mock('./utils', () => ({
  mapVisualizerTheme: (theme: string) => theme,
}));

describe('MessageMediaContent', () => {
  const baseMessage: Message = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: '',
    encryptedContent: null,
    isEncrypted: false,
    messageType: 'text',
    replyToId: null,
    replyTo: null,
    isPinned: false,
    isEdited: false,
    deletedAt: null,
    metadata: {},
    reactions: [],
    sender: { id: 'user-1', username: 'test', displayName: null, avatarUrl: null },
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };

  const defaultProps = {
    message: baseMessage,
    isOwn: false,
    voiceVisualizerTheme: 'matrix-green' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for text messages', () => {
    const { container } = render(<MessageMediaContent {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders an image for image messages', () => {
    const msg = {
      ...baseMessage,
      messageType: 'image' as const,
      metadata: { url: 'https://example.com/pic.jpg' },
    };
    render(<MessageMediaContent {...defaultProps} message={msg} />);
    const img = screen.getByAltText('Shared image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/pic.jpg');
  });

  it('renders a video for video messages', () => {
    const msg = {
      ...baseMessage,
      messageType: 'video' as const,
      metadata: { url: 'https://example.com/vid.mp4' },
    };
    const { container } = render(<MessageMediaContent {...defaultProps} message={msg} />);
    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/vid.mp4');
  });

  it('renders file link and FileMessage for file messages', () => {
    const msg = {
      ...baseMessage,
      messageType: 'file' as const,
      metadata: { url: 'https://example.com/doc.pdf', filename: 'doc.pdf' },
    };
    render(<MessageMediaContent {...defaultProps} message={msg} />);
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    expect(screen.getByTestId('file-message')).toBeInTheDocument();
  });

  it('renders voice visualizer and player for voice messages', () => {
    const msg = {
      ...baseMessage,
      messageType: 'voice' as const,
      metadata: { url: 'https://example.com/audio.ogg', duration: 30 },
    };
    render(<MessageMediaContent {...defaultProps} message={msg} />);
    expect(screen.getByTestId('voice-visualizer')).toBeInTheDocument();
    expect(screen.getByTestId('voice-player')).toBeInTheDocument();
  });

  it('renders GifMessage for gif messages', () => {
    const msg = { ...baseMessage, messageType: 'gif' as const, metadata: {} };
    render(<MessageMediaContent {...defaultProps} message={msg} />);
    expect(screen.getByTestId('gif-message')).toBeInTheDocument();
  });

  it('returns null when image message has no URL', () => {
    const msg = { ...baseMessage, messageType: 'image' as const, metadata: {} };
    const { container } = render(<MessageMediaContent {...defaultProps} message={msg} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows an add-nodes recovery action when a paid file unlock fails for balance', async () => {
    mockUnlockFile.mockResolvedValueOnce({
      ok: false,
      status: 402,
      error: {
        code: 'insufficient_balance',
        message: 'Insufficient balance',
      },
    });
    const msg = {
      ...baseMessage,
      messageType: 'file' as const,
      metadata: {
        url: 'https://example.com/locked.pdf',
        filename: 'locked.pdf',
        paid_dm_file_id: 'paid-file-1',
        nodes_price: 50,
        is_file_locked: true,
      },
    };

    render(<MessageMediaContent {...defaultProps} message={msg} />);
    fireEvent.click(screen.getByRole('button', { name: 'Unlock for 50 Nodes' }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Not enough Nodes', 'Add Nodes to continue.');
    });
    expect(screen.getByText('Add Nodes to continue.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Nodes' }));
    expect(mockNavigate).toHaveBeenCalledWith('/me/wallet/shop');
  });

  it('treats already-unlocked paid files as completed instead of false failure', async () => {
    mockUnlockFile.mockResolvedValueOnce({
      ok: false,
      status: 409,
      error: {
        code: 'already_unlocked',
        message: 'Already unlocked',
      },
    });
    const msg = {
      ...baseMessage,
      messageType: 'file' as const,
      metadata: {
        url: 'https://example.com/locked.pdf',
        filename: 'locked.pdf',
        paid_dm_file_id: 'paid-file-1',
        nodes_price: 50,
        is_file_locked: true,
      },
    };

    render(<MessageMediaContent {...defaultProps} message={msg} />);
    fireEvent.click(screen.getByRole('button', { name: 'Unlock for 50 Nodes' }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('File already unlocked');
    });
    expect(screen.queryByRole('button', { name: 'Unlock for 50 Nodes' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /locked\.pdf/i })).toHaveAttribute(
      'href',
      'https://example.com/locked.pdf'
    );
  });

  it('keeps paid files locked and shows rate-limit copy when unlock is throttled', async () => {
    mockUnlockFile.mockResolvedValueOnce({
      ok: false,
      status: 429,
      error: {
        code: 'rate_limited',
        message: 'Slow down',
      },
    });
    const msg = {
      ...baseMessage,
      messageType: 'file' as const,
      metadata: {
        url: 'https://example.com/locked.pdf',
        filename: 'locked.pdf',
        paid_dm_file_id: 'paid-file-1',
        nodes_price: 50,
        is_file_locked: true,
      },
    };

    render(<MessageMediaContent {...defaultProps} message={msg} />);
    fireEvent.click(screen.getByRole('button', { name: 'Unlock for 50 Nodes' }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Too many attempts',
        'Please wait a moment and try again.'
      );
    });
    expect(screen.getByText('Please wait a moment and try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unlock for 50 Nodes' })).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
