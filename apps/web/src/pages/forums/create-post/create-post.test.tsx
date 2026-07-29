import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreatePost from './create-post';

const { useCreatePostMock } = vi.hoisted(() => ({
  useCreatePostMock: vi.fn(),
}));

vi.mock('./hooks', () => ({
  useCreatePost: () => useCreatePostMock(),
}));
vi.mock('./post-type-tabs', () => ({
  default: () => <div data-testid="post-type-tabs" />,
}));
vi.mock('@/components/content/markdown-editor', () => ({
  default: () => <div data-testid="markdown-editor" />,
}));
vi.mock('@/modules/forums/components/attachment-uploader', () => ({
  default: () => <div data-testid="attachment-uploader" />,
}));

function createHookState(overrides: Record<string, unknown> = {}) {
  return {
    forumSlug: 'design',
    forum: { id: 'forum-1', name: 'Design' },
    canPost: true,
    postType: 'text',
    setPostType: vi.fn(),
    title: 'A useful title',
    setTitle: vi.fn(),
    content: '',
    setContent: vi.fn(),
    url: '',
    setUrl: vi.fn(),
    isSubmitting: false,
    isJoining: false,
    error: null,
    setError: vi.fn(),
    selectedPrefix: '',
    setSelectedPrefix: vi.fn(),
    attachments: [],
    setAttachments: vi.fn(),
    threadPrefixes: [],
    handleJoinForum: vi.fn(),
    handleSubmit: vi.fn((event: Event) => event.preventDefault()),
    ...overrides,
  };
}

function renderCreatePost() {
  return render(
    <MemoryRouter>
      <CreatePost />
    </MemoryRouter>,
  );
}

describe('CreatePost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCreatePostMock.mockReturnValue(createHookState());
  });

  it('disables submission until a title is present', () => {
    useCreatePostMock.mockReturnValue(createHookState({ title: '' }));

    renderCreatePost();

    expect(screen.getByRole('button', { name: 'Post' })).toBeDisabled();
  });

  it('locks submission and exposes progress while posting', () => {
    const handleSubmit = vi.fn();
    useCreatePostMock.mockReturnValue(
      createHookState({ isSubmitting: true, handleSubmit }),
    );

    renderCreatePost();
    const submit = screen.getByRole('button', { name: 'Posting…' });

    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(submit);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits through the owned form handler exactly once', () => {
    const handleSubmit = vi.fn((event: Event) => event.preventDefault());
    useCreatePostMock.mockReturnValue(createHookState({ handleSubmit }));

    renderCreatePost();
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    expect(handleSubmit).toHaveBeenCalledOnce();
  });

  it('uses the working attachment owner for image posts', () => {
    useCreatePostMock.mockReturnValue(createHookState({ postType: 'image' }));

    renderCreatePost();

    expect(screen.getByTestId('attachment-uploader')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upload' })).not.toBeInTheDocument();
  });

  it('dismisses an error through an accessible icon action', () => {
    const setError = vi.fn();
    useCreatePostMock.mockReturnValue(
      createHookState({ error: 'Post failed', setError }),
    );

    renderCreatePost();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss error' }));

    expect(setError).toHaveBeenCalledOnce();
    expect(setError).toHaveBeenCalledWith(null);
  });
});
