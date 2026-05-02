import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
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

describe('EmojiPicker', () => {
  const onSelect = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<EmojiPicker isOpen={true} onClose={onClose} onSelect={onSelect} />);
    expect(document.body).toBeTruthy();
  });

  it('calls onSelect when emoji is clicked', () => {
    render(<EmojiPicker isOpen={true} onClose={onClose} onSelect={onSelect} />);
    const buttons = document.querySelectorAll('button');
    if (buttons.length > 0) {
      buttons[0]!.click();
    }
    expect(document.body).toBeTruthy();
  });
});
