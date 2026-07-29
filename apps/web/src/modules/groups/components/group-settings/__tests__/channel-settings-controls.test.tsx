import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ChannelCategoriesPanel } from '../channel-categories-panel';
import { ChannelPermissionsPanel } from '../channel-permissions-panel';

const apiMocks = vi.hoisted(() => ({
  createCategory: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    groups: {
      createCategory: apiMocks.createCategory,
    },
  },
  http: {
    delete: apiMocks.delete,
    get: apiMocks.get,
    post: apiMocks.post,
    put: apiMocks.put,
  },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => {
    const { variant: _variant, ...elementProps } = props;
    return <div {...elementProps}>{children}</div>;
  },
}));

function withoutMotionProps(props: Record<string, unknown>) {
  const nextProps = { ...props };
  delete nextProps.animate;
  delete nextProps.axis;
  delete nextProps.exit;
  delete nextProps.initial;
  delete nextProps.onReorder;
  delete nextProps.transition;
  delete nextProps.values;
  delete nextProps.variants;
  delete nextProps.whileHover;
  delete nextProps.whileTap;
  return nextProps;
}

vi.mock('motion/react', () => ({
  motion: {
    button: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <button {...withoutMotionProps(props)}>{children}</button>
    ),
    div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <div {...withoutMotionProps(props)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
  Reorder: {
    Group: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <div {...withoutMotionProps(props)}>{children}</div>
    ),
    Item: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <div {...withoutMotionProps(props)}>{children}</div>
    ),
  },
}));

const categories = [
  { id: 'core', name: 'Core', position: 0, is_collapsed: false },
  { id: 'updates', name: 'Updates', position: 1, is_collapsed: false },
];

function mockCategoryRequests() {
  apiMocks.get.mockImplementation((url: string) => {
    if (url.endsWith('/categories')) {
      return Promise.resolve({ data: { data: categories } });
    }
    if (url.endsWith('/channels')) {
      return Promise.resolve({
        data: {
          data: [
            {
              id: 'core',
              channels: [{ id: 'general', category_id: 'core' }],
            },
          ],
        },
      });
    }
    throw new Error(`Unexpected GET ${url}`);
  });
}

function mockPermissionRequests() {
  apiMocks.get.mockImplementation((url: string) => {
    if (url.endsWith('/permissions')) {
      return Promise.resolve({
        data: {
          data: [
            {
              id: 'overwrite-1',
              type: 'role',
              role_id: 'owners',
              role_name: 'Owners',
              allow: 0,
              deny: 0,
            },
          ],
        },
      });
    }
    if (url.endsWith('/roles')) {
      return Promise.resolve({
        data: {
          data: [
            { id: 'owners', name: 'Owners', color: '#22c55e' },
            { id: 'moderators', name: 'Moderators', color: '#60a5fa' },
          ],
        },
      });
    }
    throw new Error(`Unexpected GET ${url}`);
  });
}

describe('ChannelCategoriesPanel controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCategoryRequests();
    apiMocks.createCategory.mockResolvedValue({ ok: true, data: {} });
    apiMocks.delete.mockResolvedValue({});
    apiMocks.put.mockResolvedValue({});
  });

  it('creates and renames categories through the existing API contracts', async () => {
    render(<ChannelCategoriesPanel groupId="group-1" />);
    await screen.findByText('Core');
    expect(screen.getByText('1 channel')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Category' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Category name' }), {
      target: { value: ' Community ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(apiMocks.createCategory).toHaveBeenCalledWith('group-1', 'Community')
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit Core' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Category name for Core' }), {
      target: { value: 'Core Team' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(apiMocks.put).toHaveBeenCalledWith('/api/v1/groups/group-1/categories/core', {
        name: 'Core Team',
      })
    );
  });

  it('keeps boundary controls explicit and persists ordered category positions', async () => {
    render(<ChannelCategoriesPanel groupId="group-1" />);
    await screen.findByText('Core');

    expect(screen.getByRole('button', { name: 'Move Core up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Updates down' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Move Core down' }));

    await waitFor(() => {
      expect(apiMocks.put).toHaveBeenCalledWith('/api/v1/groups/group-1/categories/updates', {
        position: 0,
      });
      expect(apiMocks.put).toHaveBeenCalledWith('/api/v1/groups/group-1/categories/core', {
        position: 1,
      });
    });
  });

  it('uses the shared confirmation dialog before deleting a category', async () => {
    render(<ChannelCategoriesPanel groupId="group-1" />);
    await screen.findByText('Core');

    fireEvent.click(screen.getByRole('button', { name: 'Delete Core' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete Category' });
    expect(dialog).toHaveTextContent('Channels in this category will become uncategorized.');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(apiMocks.delete).toHaveBeenCalledWith('/api/v1/groups/group-1/categories/core')
    );
  });
});

describe('ChannelPermissionsPanel controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPermissionRequests();
    apiMocks.delete.mockResolvedValue({});
    apiMocks.post.mockResolvedValue({});
    apiMocks.put.mockResolvedValue({});
  });

  it('adds a role overwrite with the selected target and unchanged payload', async () => {
    render(
      <ChannelPermissionsPanel
        groupId="group-1"
        channelId="general"
        channelName="general"
        onClose={vi.fn()}
      />
    );
    await screen.findByText('Owners');

    fireEvent.click(screen.getByRole('button', { name: 'Add Override' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Role' }), {
      target: { value: 'moderators' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() =>
      expect(apiMocks.post).toHaveBeenCalledWith(
        '/api/v1/groups/group-1/channels/general/permissions',
        {
          type: 'role',
          role_id: 'moderators',
          member_id: undefined,
          allow: 0,
          deny: 0,
        }
      )
    );
  });

  it('persists the proven tri-state permission bit and removes an overwrite', async () => {
    render(
      <ChannelPermissionsPanel
        groupId="group-1"
        channelId="general"
        channelName="general"
        onClose={vi.fn()}
      />
    );
    await screen.findByText('Owners');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send Messages: inherit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() =>
      expect(apiMocks.put).toHaveBeenCalledWith(
        '/api/v1/groups/group-1/channels/general/permissions/overwrite-1',
        { allow: 2, deny: 0 }
      )
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(apiMocks.delete).toHaveBeenCalledWith(
        '/api/v1/groups/group-1/channels/general/permissions/overwrite-1'
      )
    );
  });

  it('exposes one labelled dialog and delegates close without changing state ownership', async () => {
    const onClose = vi.fn();
    render(
      <ChannelPermissionsPanel
        groupId="group-1"
        channelId="general"
        channelName="general"
        onClose={onClose}
      />
    );
    await screen.findByText('Owners');

    expect(screen.getByRole('dialog', { name: 'Channel Permissions' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close channel permissions' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows a recoverable load error without presenting an empty permission state', async () => {
    apiMocks.get.mockRejectedValue(new Error('offline'));

    render(
      <ChannelPermissionsPanel
        groupId="group-1"
        channelId="general"
        channelName="general"
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load channel permissions. Please try again.'
    );
    expect(screen.queryByText('No permission overrides.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('keeps an overwrite editable and reports a failed save', async () => {
    apiMocks.put.mockRejectedValue(new Error('save failed'));

    render(
      <ChannelPermissionsPanel
        groupId="group-1"
        channelId="general"
        channelName="general"
        onClose={vi.fn()}
      />
    );
    await screen.findByText('Owners');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Attach Files: inherit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('save failed');
    expect(screen.getByRole('button', { name: 'Attach Files: allow' })).toBeInTheDocument();
    expect(apiMocks.put).toHaveBeenCalledWith(
      '/api/v1/groups/group-1/channels/general/permissions/overwrite-1',
      { allow: 4, deny: 0 }
    );
  });
});
