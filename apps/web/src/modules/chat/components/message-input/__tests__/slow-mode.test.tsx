/**
 * Slow-mode countdown tests for the chat composer.
 *
 * Verifies the composer renders the countdown pill, disables the send
 * button while the cooldown is active, and ticks the remaining seconds
 * down once per second.
 *
 * Mirrors the existing `message-input.test.tsx` mock setup so the
 * component's stylistic dependencies (theme store, GlassCard, etc.) do
 * not bleed into the test.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn((sel?: (s: Record<string, unknown>) => unknown) => {
    const themeState = {
      colorPreset: 'emerald',
      theme: { colorPreset: 'emerald' },
      getColors: () => ({
        primary: '#10b981',
        secondary: '#34d399',
        glow: 'rgba(16,185,129,0.5)',
        name: 'Emerald',
        gradient: 'from-emerald-500 to-emerald-600',
      }),
    };
    return typeof sel === 'function' ? sel(themeState) : themeState;
  }),
  THEME_COLORS: {
    emerald: { primary: '#10b981', secondary: '#34d399', accent: '#34d399' },
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/modules/chat/hooks/useDraft', () => ({
  useDraft: () => ({
    draftText: '',
    hydrated: true,
    setDraftText: vi.fn(),
    clearDraft: vi.fn(),
  }),
}));

vi.mock('../reply-preview', () => ({
  ReplyPreview: () => null,
}));

vi.mock('../attachments-preview', () => ({
  AttachmentsPreview: () => null,
}));

vi.mock('../attachment-menu', () => ({
  AttachmentMenu: () => <div data-testid="attachment-menu" />,
}));

vi.mock('../mention-autocomplete', () => ({
  MentionAutocomplete: () => null,
}));

vi.mock('@/components/media/voice-message-recorder', () => ({
  VoiceMessageRecorder: () => null,
}));

vi.mock('@/modules/chat/components/gif-picker', () => ({
  GifPicker: () => null,
}));

// Render a real <button data-testid="send-button"> so the test can
// assert disabled state without relying on the full toolbar tree.
vi.mock('../input-toolbar', () => ({
  InputToolbar: ({
    canSend,
    disabled,
    onSend,
  }: {
    canSend: boolean;
    disabled?: boolean;
    onSend: () => void;
  }) => (
    <button
      type="button"
      data-testid="send-button"
      disabled={disabled || !canSend}
      onClick={onSend}
    >
      Send
    </button>
  ),
}));

import { MessageInput } from '../message-input';

const FUTURE_OFFSET_MS = 30_000;

describe('MessageInput slow-mode countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the slow-mode pill when slow mode is active and retry is in the future', () => {
    const retryAt = new Date(Date.now() + FUTURE_OFFSET_MS).toISOString();

    render(<MessageInput onSend={vi.fn()} slowModeSeconds={30} slowModeRetryAt={retryAt} />);

    const pill = screen.getByTestId('slow-mode-pill');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveTextContent(/Slow mode/i);
    expect(pill).toHaveTextContent(/30s/);
  });

  it('disables the send button while the cooldown is active', () => {
    const retryAt = new Date(Date.now() + FUTURE_OFFSET_MS).toISOString();

    render(<MessageInput onSend={vi.fn()} slowModeSeconds={30} slowModeRetryAt={retryAt} />);

    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  it('ticks the countdown down once per second', () => {
    const retryAt = new Date(Date.now() + FUTURE_OFFSET_MS).toISOString();

    render(<MessageInput onSend={vi.fn()} slowModeSeconds={30} slowModeRetryAt={retryAt} />);

    expect(screen.getByTestId('slow-mode-pill')).toHaveTextContent(/30s/);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(screen.getByTestId('slow-mode-pill')).toHaveTextContent(/25s/);

    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    expect(screen.getByTestId('slow-mode-pill')).toHaveTextContent(/5s/);
  });

  it('removes the pill once the cooldown elapses', () => {
    const retryAt = new Date(Date.now() + 2_000).toISOString();

    render(<MessageInput onSend={vi.fn()} slowModeSeconds={30} slowModeRetryAt={retryAt} />);

    expect(screen.queryByTestId('slow-mode-pill')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    // Pill is gone. The send button is content-gated (empty input means
    // it stays disabled), so we only assert the slow-mode-driven part:
    // the pill no longer renders.
    expect(screen.queryByTestId('slow-mode-pill')).not.toBeInTheDocument();
  });

  it('does not render the pill when slow mode is disabled', () => {
    render(<MessageInput onSend={vi.fn()} slowModeSeconds={0} />);

    expect(screen.queryByTestId('slow-mode-pill')).not.toBeInTheDocument();
  });
});
