import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MessageRequestPanel } from '../message-request-panel';
import type { MessageRequestController } from '../../hooks/use-message-request';

function controller(
  overrides: Partial<MessageRequestController> = {}
): MessageRequestController {
  return {
    status: 'pending',
    details: {
      requesterName: 'Ada Lovelace',
      requesterAvatar: null,
      sharedGroupCount: 2,
      reportedAsSpam: false,
    },
    activeAction: null,
    error: null,
    blocksComposer: true,
    retry: vi.fn(),
    accept: vi.fn(async () => true),
    deleteRequest: vi.fn(async () => true),
    block: vi.fn(async () => true),
    blockAndReport: vi.fn(async () => true),
    unblock: vi.fn(async () => true),
    ...overrides,
  };
}

describe('MessageRequestPanel', () => {
  it('renders the pending S1G action matrix with stable accessible targets', () => {
    render(<MessageRequestPanel request={controller()} onDeleted={vi.fn()} />);

    expect(screen.getByText('Review request carefully')).toBeInTheDocument();
    expect(screen.getByText('2 shared groups')).toBeInTheDocument();

    for (const name of ['Block', 'Block & report', 'Delete', 'Accept']) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveClass('min-h-11');
      expect(button).toBeEnabled();
    }
  });

  it('exits the conversation only after delete succeeds', async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    const failedDelete = vi.fn(async () => false);
    const { rerender } = render(
      <MessageRequestPanel
        request={controller({ deleteRequest: failedDelete })}
        onDeleted={onDeleted}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(failedDelete).toHaveBeenCalledTimes(1);
    expect(onDeleted).not.toHaveBeenCalled();

    const successfulDelete = vi.fn(async () => true);
    rerender(
      <MessageRequestPanel
        request={controller({ deleteRequest: successfulDelete })}
        onDeleted={onDeleted}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(successfulDelete).toHaveBeenCalledTimes(1);
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('shows unblock behavior for blocked requests and hides duplicate spam reporting', () => {
    render(
      <MessageRequestPanel
        request={controller({
          status: 'blocked',
          details: {
            requesterName: 'Ada Lovelace',
            requesterAvatar: null,
            sharedGroupCount: 0,
            reportedAsSpam: true,
          },
        })}
        onDeleted={vi.fn()}
      />
    );

    expect(screen.getByText('Conversation blocked')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unblock & accept' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Report spam' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
  });

  it('renders no replacement panel after the request is accepted', () => {
    const { container } = render(
      <MessageRequestPanel
        request={controller({
          status: 'accepted',
          details: null,
          blocksComposer: false,
        })}
        onDeleted={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a retryable fail-closed state when request loading fails', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();

    render(
      <MessageRequestPanel
        request={controller({
          status: 'error',
          details: null,
          error: 'Network unavailable',
          retry,
        })}
        onDeleted={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
