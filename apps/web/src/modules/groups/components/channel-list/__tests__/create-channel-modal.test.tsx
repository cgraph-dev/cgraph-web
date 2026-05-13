/**
 * CreateChannelModal Component Tests
 *
 * Tests for channel creation form: name input, type selection,
 * NSFW toggle, API submission, and error handling.
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
      initial: _initial,
      animate: _animate,
      exit: _exit,
      whileTap: _whileTap,
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
      className,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      whileTap: _whileTap,
      ...rest
    }: Record<string, unknown> & {
      children?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      className?: string;
    }) => (
      <button onClick={onClick} disabled={disabled} className={className} {...rest}>
        {children}
      </button>
    ),
  },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: (props: Record<string, unknown>) => <svg data-testid="SparklesIcon" {...props} />,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  chatLogger: { log: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/animations/transitions', () => ({
  FADE_IN: { initial: { opacity: 0 }, animate: { opacity: 1 } },
}));

const mockApiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  api: { post: (...args: unknown[]) => mockApiPost(...args) },
}));

const mockFetchGroup = vi.fn().mockResolvedValue(undefined);
vi.mock('@/modules/groups/store', () => ({
  useGroupStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = { fetchGroup: mockFetchGroup };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../constants', () => ({
  channelTypeIcons: {
    text: (p: Record<string, unknown>) => <svg data-testid="text-icon" {...p} />,
    voice: (p: Record<string, unknown>) => <svg data-testid="voice-icon" {...p} />,
    video: (p: Record<string, unknown>) => <svg data-testid="video-icon" {...p} />,
    announcement: (p: Record<string, unknown>) => <svg data-testid="announcement-icon" {...p} />,
    forum: (p: Record<string, unknown>) => <svg data-testid="forum-icon" {...p} />,
  },
  channelTypes: [
    {
      value: 'text',
      label: 'Text',
      icon: (p: Record<string, unknown>) => <svg data-testid="type-text" {...p} />,
    },
    {
      value: 'voice',
      label: 'Voice',
      icon: (p: Record<string, unknown>) => <svg data-testid="type-voice" {...p} />,
    },
    {
      value: 'video',
      label: 'Video',
      icon: (p: Record<string, unknown>) => <svg data-testid="type-video" {...p} />,
    },
    {
      value: 'announcement',
      label: 'Announcement',
      icon: (p: Record<string, unknown>) => <svg data-testid="type-ann" {...p} />,
    },
    {
      value: 'forum',
      label: 'Forum',
      icon: (p: Record<string, unknown>) => <svg data-testid="type-forum" {...p} />,
    },
  ],
}));

import { CreateChannelModal } from '../create-channel-modal';

// --- Tests ---

describe('CreateChannelModal', () => {
  const getCreateButton = () => screen.getByRole('button', { name: 'Create Channel' });

  const defaultProps = {
    groupId: 'g-1',
    categoryId: 'cat-1',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal with title', () => {
    render(<CreateChannelModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Create Channel' })).toBeInTheDocument();
    expect(screen.getByText('Add a new channel to your group')).toBeInTheDocument();
  });

  it('renders channel type selection buttons', () => {
    render(<CreateChannelModal {...defaultProps} />);
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Voice')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
  });

  it('renders name input field', () => {
    render(<CreateChannelModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('general')).toBeInTheDocument();
  });

  it('transforms input to lowercase with hyphens', () => {
    render(<CreateChannelModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('general');
    fireEvent.change(input, { target: { value: 'My Cool Channel' } });
    expect((input as HTMLInputElement).value).toBe('my-cool-channel');
  });

  it('disables create button when name is empty', () => {
    render(<CreateChannelModal {...defaultProps} />);
    const createBtn = getCreateButton();
    expect(createBtn).toBeDisabled();
  });

  it('enables create button when name is entered', () => {
    render(<CreateChannelModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('general'), { target: { value: 'test' } });
    const createBtn = getCreateButton();
    expect(createBtn).not.toBeDisabled();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<CreateChannelModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const { container } = render(<CreateChannelModal {...defaultProps} />);
    // The outer overlay div is the backdrop
    const backdrop = container.firstElementChild;
    if (backdrop) fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('submits channel creation to API', async () => {
    mockApiPost.mockResolvedValueOnce({
      data: { data: { id: 'ch-new', name: 'test-channel', type: 'text' } },
    });

    render(<CreateChannelModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('general'), { target: { value: 'test-channel' } });
    fireEvent.click(getCreateButton());

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/v1/groups/g-1/channels', {
        name: 'test-channel',
        type: 'text',
        category_id: 'cat-1',
        is_private: false,
      });
    });
    expect(mockFetchGroup).toHaveBeenCalledWith('g-1');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles API error without crashing', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('Server error'));

    render(<CreateChannelModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('general'), { target: { value: 'fail-channel' } });
    fireEvent.click(getCreateButton());

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalled();
    });
    // Modal should not close on error
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('renders NSFW toggle', () => {
    render(<CreateChannelModal {...defaultProps} />);
    expect(screen.getByText('Age-Restricted')).toBeInTheDocument();
  });

  it('sends undefined category_id when categoryId is null', async () => {
    mockApiPost.mockResolvedValueOnce({
      data: { data: { id: 'ch-new', name: 'uncategorized', type: 'text' } },
    });

    render(<CreateChannelModal {...defaultProps} categoryId={null} />);
    fireEvent.change(screen.getByPlaceholderText('general'), {
      target: { value: 'uncategorized' },
    });
    fireEvent.click(getCreateButton());

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ category_id: undefined })
      );
    });
  });
});
