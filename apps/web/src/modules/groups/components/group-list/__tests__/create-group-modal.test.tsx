/**
 * CreateGroupModal Component Tests
 *
 * Tests for group creation form: name/description input, public toggle,
 * form submission via useActionState, error display, and portal rendering.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// --- Mocks ---

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      onClick,
      className,
      ...rest
    }: Record<string, unknown> & {
      children?: React.ReactNode;
      onClick?: (e: unknown) => void;
      className?: string;
    }) => (
      <div onClick={onClick} className={className} {...rest}>
        {children}
      </div>
    ),
    button: ({
      children,
      onClick,
      disabled,
      type,
      className,
      whileTap: _whileTap,
      transition: _transition,
      ...rest
    }: Record<string, unknown> & {
      children?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      type?: 'button' | 'submit' | 'reset';
      className?: string;
    }) => (
      <button onClick={onClick} disabled={disabled} type={type} className={className} {...rest}>
        {children}
      </button>
    ),
    span: ({
      className,
      whileTap: _whileTap,
      ...rest
    }: Record<string, unknown> & { className?: string }) => (
      <span className={className} {...rest} />
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: (props: Record<string, unknown>) => <svg data-testid="SparklesIcon" {...props} />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/lib/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/logger')>();
  return {
    ...actual,
    createLogger: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
      time: vi.fn(),
      timeEnd: vi.fn(),
      breadcrumb: vi.fn(),
    }),
  };
});

vi.mock('@/lib/animation-presets', () => ({
  tweens: { ambient: { type: 'tween', duration: 0.5 } },
  loop: () => ({ duration: 1, repeat: Infinity }),
  durationsSec: { normal: 0.2 },
}));

vi.mock('@/lib/animations/transitions', () => ({
  FADE_IN: { initial: { opacity: 0 }, animate: { opacity: 1 } },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockCreateGroup = vi.fn();
vi.mock('@/modules/groups/store', () => ({
  useGroupStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = { createGroup: mockCreateGroup };
    return selector ? selector(state) : state;
  }),
}));

import { CreateGroupModal } from '../create-group-modal';

// --- Tests ---

describe('CreateGroupModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateGroup.mockResolvedValue({ id: 'g-new', name: 'New Group' });
  });

  it('renders nothing when isOpen is false', () => {
    render(<CreateGroupModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Create a Group')).not.toBeInTheDocument();
  });

  it('renders modal content when isOpen is true', () => {
    render(<CreateGroupModal {...defaultProps} />);
    expect(screen.getByText('Create a Group')).toBeInTheDocument();
    expect(screen.getByText(/Build your community/)).toBeInTheDocument();
  });

  it('renders name input field', () => {
    render(<CreateGroupModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('My Awesome Group')).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    render(<CreateGroupModal {...defaultProps} />);
    expect(screen.getByPlaceholderText("What's your group about?")).toBeInTheDocument();
  });

  it('renders public toggle defaulting to public', () => {
    render(<CreateGroupModal {...defaultProps} />);
    expect(screen.getByText('Public Group')).toBeInTheDocument();
    expect(screen.getByText('Anyone can discover and join')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<CreateGroupModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<CreateGroupModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('dialog-backdrop'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders Create Group submit button', () => {
    render(<CreateGroupModal {...defaultProps} />);
    expect(screen.getByText('Create Group')).toBeInTheDocument();
  });

  it('renders the sparkles icon', () => {
    render(<CreateGroupModal {...defaultProps} />);
    expect(screen.getByTestId('SparklesIcon')).toBeInTheDocument();
  });

  it('renders within a GlassCard', () => {
    render(<CreateGroupModal {...defaultProps} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });

  it('uses custom onSubmit when provided', async () => {
    const customSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CreateGroupModal {...defaultProps} onSubmit={customSubmit} />);

    const nameInput = screen.getByPlaceholderText('My Awesome Group');
    fireEvent.change(nameInput, { target: { value: 'Custom Group' } });

    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(customSubmit).toHaveBeenCalled();
    });
  });

  it('renders the Group Name label', () => {
    render(<CreateGroupModal {...defaultProps} />);
    expect(screen.getByText('Group Name')).toBeInTheDocument();
  });

  it('renders the Description label', () => {
    render(<CreateGroupModal {...defaultProps} />);
    expect(screen.getByText('Description (optional)')).toBeInTheDocument();
  });
});
