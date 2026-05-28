import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EmojiPicker } from '../emoji-picker';

// Mock dependencies
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<EmojiPicker isOpen={true} onClose={onClose} onSelect={onSelect} />);
    expect(screen.getByRole('dialog', { name: /emoji picker/i })).toBeInTheDocument();
  });

  it('calls onSelect when emoji is clicked', () => {
    render(<EmojiPicker isOpen={true} onClose={onClose} onSelect={onSelect} />);
    const emojiButton = screen.getAllByRole('button', { name: /select emoji/i })[0];
    if (emojiButton === undefined) throw new Error('emoji button missing');
    fireEvent.click(emojiButton);
    expect(onSelect).toHaveBeenCalled();
  });
});
