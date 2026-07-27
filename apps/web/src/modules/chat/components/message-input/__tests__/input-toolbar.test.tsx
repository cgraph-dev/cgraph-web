import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { InputToolbar } from '../input-toolbar';

function renderToolbar(overrides: Partial<React.ComponentProps<typeof InputToolbar>> = {}) {
  const props: React.ComponentProps<typeof InputToolbar> = {
    attachmentMode: 'none',
    isRecording: false,
    isVideoRecording: false,
    canSend: false,
    disabled: false,
    isViewOnce: false,
    hasAttachments: false,
    emojiTriggerRef: createRef<HTMLButtonElement>(),
    onToggleMode: vi.fn(),
    onToggleRecording: vi.fn(),
    onToggleVideoRecording: vi.fn(),
    onToggleViewOnce: vi.fn(),
    onSend: vi.fn(),
    ...overrides,
  };

  return { props, ...render(<InputToolbar {...props} />) };
}

describe('InputToolbar', () => {
  it('uses the canonical control contract for every visible action', () => {
    renderToolbar();

    const toolbar = screen.getByRole('toolbar', { name: 'Message tools' });
    const buttons = Array.from(toolbar.querySelectorAll('button'));

    expect(buttons).toHaveLength(6);
    for (const button of buttons) {
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('data-cgraph-surface', 'control');
      expect(button).toHaveClass('cgraph-control', 'cgraph-control-icon');
    }
  });

  it('exposes pressed states through semantic variants', () => {
    renderToolbar({
      attachmentMode: 'emoji',
      isRecording: true,
      isVideoRecording: true,
    });

    expect(screen.getByRole('button', { name: 'Open emoji picker' })).toHaveAttribute(
      'data-cgraph-variant',
      'secondary'
    );
    expect(screen.getByRole('button', { name: 'Voice recorder active' })).toHaveAttribute(
      'data-cgraph-variant',
      'danger'
    );
    expect(screen.getByRole('button', { name: 'Video note recorder active' })).toHaveAttribute(
      'data-cgraph-variant',
      'danger'
    );
  });

  it('owns the emoji trigger ref used by the anchored picker', () => {
    const emojiTriggerRef = createRef<HTMLButtonElement>();
    renderToolbar({ emojiTriggerRef });

    expect(emojiTriggerRef.current).toBe(
      screen.getByRole('button', { name: 'Open emoji picker' })
    );
  });

  it('shows view-once only for attachments and reports its active state', () => {
    const { rerender, props } = renderToolbar();

    expect(screen.queryByRole('button', { name: 'Enable view once' })).not.toBeInTheDocument();

    rerender(<InputToolbar {...props} hasAttachments isViewOnce />);

    const viewOnce = screen.getByRole('button', { name: 'Disable view once' });
    expect(viewOnce).toHaveAttribute('aria-pressed', 'true');
    expect(viewOnce).toHaveAttribute('data-cgraph-variant', 'secondary');
  });

  it('enables the primary send action only when content can be sent', () => {
    const onSend = vi.fn();
    const { rerender, props } = renderToolbar({ onSend });

    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();

    rerender(<InputToolbar {...props} canSend />);
    const send = screen.getByRole('button', { name: 'Send message' });

    expect(send).toBeEnabled();
    expect(send).toHaveAttribute('data-cgraph-variant', 'primary');
    fireEvent.click(send);
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});
