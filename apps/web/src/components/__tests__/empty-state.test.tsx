import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import EmptyState, {
  NoMessagesEmpty,
  NoFriendsEmpty,
  NoPostsEmpty,
  SearchNoResults,
} from '../ui/empty-state';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<EmptyState title="Empty" message="Some description text" />);
    expect(screen.getByText('Some description text')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByText('No items to display.')).toBeInTheDocument();
  });

  it('renders an icon when provided', () => {
    render(<EmptyState title="Empty" icon={<span data-testid="icon">★</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders the shared fallback icon container when no icon is provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const iconWrappers = container.querySelectorAll('.cgraph-empty-icon');
    expect(iconWrappers).toHaveLength(1);
  });

  it('renders the action button and handles click', () => {
    const onClick = vi.fn();
    render(<EmptyState title="Empty" action={{ label: 'Do Something', onClick }} />);
    const button = screen.getByRole('button', { name: 'Do Something' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when not provided', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Empty" className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});

describe('EmptyMessages', () => {
  it('renders no-messages text', () => {
    render(<NoMessagesEmpty />);
    expect(screen.getByText('No Messages')).toBeInTheDocument();
    expect(screen.getByText(/haven't started any conversations/i)).toBeInTheDocument();
  });

  it('renders action button when onStartConversation is provided', () => {
    const handler = vi.fn();
    render(<NoMessagesEmpty onStartChat={handler} />);
    const button = screen.getByRole('button', { name: 'Start Chat' });
    fireEvent.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when onStartConversation is omitted', () => {
    render(<NoMessagesEmpty />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('EmptyConversations', () => {
  it('renders no-friends text with action', () => {
    const handler = vi.fn();
    render(<NoFriendsEmpty onAddFriend={handler} />);
    expect(screen.getByText('No Friends Yet')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Add Friends' });
    fireEvent.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyGroups', () => {
  it('renders no-posts text with action', () => {
    const handler = vi.fn();
    render(<NoPostsEmpty onCreatePost={handler} />);
    expect(screen.getByText('No Posts Yet')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Create Post' });
    fireEvent.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyForums', () => {
  it('renders the default empty state when no props are provided', () => {
    render(<EmptyState />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.getByText('No items to display.')).toBeInTheDocument();
  });
});

describe('EmptySearchResults', () => {
  it('renders no-results text including the search query', () => {
    render(<SearchNoResults query="foobar" />);
    expect(screen.getByText('No Results Found')).toBeInTheDocument();
    expect(screen.getByText(/foobar/)).toBeInTheDocument();
  });

  it('does not render an action button', () => {
    render(<SearchNoResults query="test" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('EmptyNotifications', () => {
  it('renders the default fallback icon wrapper', () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelector('.cgraph-empty-icon')).not.toBeNull();
  });
});
