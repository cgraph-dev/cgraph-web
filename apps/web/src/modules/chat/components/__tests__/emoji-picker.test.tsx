import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EmojiPicker } from '../emoji-picker';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => <button {...props}>{children}</button>,
    input: (props: Record<string, unknown>) => <input {...props} />,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useMotionValue: (initial: number) => ({ get: () => initial, set: () => {}, on: () => () => {} }),
  useSpring: (value: unknown) => value,
  useTransform: (value: unknown) => value,
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn() },
}));

vi.mock('../emoji-picker/useEmojiPicker', async () => {
  const actual = await vi.importActual<typeof import('../emoji-picker/useEmojiPicker')>(
    '../emoji-picker/useEmojiPicker'
  );
  return {
    ...actual,
    useAnimatedEmojiCatalog: () => ({ catalog: new Map(), loading: false }),
  };
});

describe('EmojiPicker', () => {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    });
  });

  function createAnchor(right: number, top = 700) {
    const anchor = document.createElement('button');
    anchor.getBoundingClientRect = vi.fn(
      () =>
        ({
          bottom: top + 36,
          height: 36,
          left: right - 36,
          right,
          top,
          width: 36,
          x: right - 36,
          y: top,
          toJSON: () => ({}),
        }) as DOMRect
    );
    document.body.append(anchor);
    return { current: anchor };
  }

  it('renders canonical picker controls', () => {
    render(<EmojiPicker isOpen={true} onClose={onClose} onSelect={onSelect} />);

    expect(screen.getByRole('dialog', { name: /emoji picker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close emoji picker' })).toHaveAttribute(
      'data-cgraph-surface',
      'control'
    );
    expect(screen.getByRole('button', { name: 'Animated' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('calls onSelect when emoji is clicked', () => {
    render(<EmojiPicker isOpen={true} onClose={onClose} onSelect={onSelect} />);
    const emojiButton = screen.getAllByRole('button', { name: /select emoji/i })[0];
    if (emojiButton === undefined) throw new Error('emoji button missing');
    fireEvent.click(emojiButton);
    expect(onSelect).toHaveBeenCalled();
  });

  it('positions from the owned trigger instead of a global selector', () => {
    render(
      <EmojiPicker
        isOpen
        anchorRef={createAnchor(600)}
        onClose={onClose}
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole('dialog', { name: /emoji picker/i })).toHaveStyle({
      left: '280px',
    });
  });

  it('clamps the picker inside a narrow mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 300 });

    render(
      <EmojiPicker
        isOpen
        anchorRef={createAnchor(290)}
        onClose={onClose}
        onSelect={onSelect}
      />
    );

    expect(screen.getByRole('dialog', { name: /emoji picker/i })).toHaveStyle({
      left: '8px',
    });
  });
});
