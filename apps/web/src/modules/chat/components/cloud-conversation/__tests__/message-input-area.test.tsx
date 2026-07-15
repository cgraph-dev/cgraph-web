import { createRef } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInputArea } from '../message-input-area';
import type { MessageInputAreaProps } from '../types';
import type { MessagePayload } from '@/modules/chat/components/message-input';

const sharedInputMock = vi.hoisted(() => ({
  props: null as null | Record<string, unknown>,
}));

vi.mock('@/modules/chat/components/message-input', () => ({
  MessageInput: (props: Record<string, unknown>) => {
    sharedInputMock.props = props;

    return (
      <div data-testid="shared-message-input">
        <button
          type="button"
          onClick={() =>
            (props.onSend as (payload: MessagePayload) => void)({
              content: 'hello',
              type: 'text',
            })
          }
        >
          Send shared payload
        </button>
        <button type="button" onClick={() => (props.onTyping as (value: boolean) => void)(true)}>
          Start typing
        </button>
        <button
          type="button"
          onClick={() => (props.onNodesPriceChange as (price: number | null) => void)(10)}
        >
          Lock for Nodes
        </button>
        <button type="button" onClick={() => (props.onCancelReply as () => void)()}>
          Cancel reply
        </button>
      </div>
    );
  },
}));

function makeProps(overrides: Partial<MessageInputAreaProps> = {}): MessageInputAreaProps {
  return {
    conversationId: 'conv-1',
    attachmentNodePrice: null,
    isUploading: false,
    replyTo: null,
    onTyping: vi.fn(),
    onAttachmentNodePriceChange: vi.fn(),
    onClearReply: vi.fn(),
    onPayloadSend: vi.fn(),
    ...overrides,
  };
}

describe('CloudConversation MessageInputArea', () => {
  beforeEach(() => {
    sharedInputMock.props = null;
  });

  it('disables the shared composer only while an upload is active', () => {
    render(
      <MessageInputArea
        {...makeProps({ isUploading: true })}
        inputContainerRef={createRef<HTMLDivElement>()}
      />
    );

    expect(sharedInputMock.props).toMatchObject({ disabled: true });
  });

  it('routes the Cloud Chat composer through the shared message input contract', async () => {
    const user = userEvent.setup();
    const props = makeProps();

    render(<MessageInputArea {...props} inputContainerRef={createRef<HTMLDivElement>()} />);

    expect(screen.getByTestId('shared-message-input')).toBeInTheDocument();
    expect(sharedInputMock.props).toMatchObject({
      conversationId: 'conv-1',
      disabled: false,
      maxAttachments: 1,
      nodesPrice: null,
    });

    await user.click(screen.getByRole('button', { name: /send shared payload/i }));

    expect(props.onPayloadSend).toHaveBeenCalledWith({ content: 'hello', type: 'text' });
  });

  it('keeps typing and paid-file pricing owned by the routed conversation owner', async () => {
    const user = userEvent.setup();
    const props = makeProps({ attachmentNodePrice: 5 });

    render(<MessageInputArea {...props} inputContainerRef={createRef<HTMLDivElement>()} />);

    await user.click(screen.getByRole('button', { name: /start typing/i }));
    await user.click(screen.getByRole('button', { name: /lock for nodes/i }));

    expect(props.onTyping).toHaveBeenCalledWith(true);
    expect(props.onAttachmentNodePriceChange).toHaveBeenCalledWith(10);
    expect(sharedInputMock.props).toMatchObject({
      nodesPrice: 5,
    });
  });

  it('maps route-owned reply messages into the shared reply contract', async () => {
    const user = userEvent.setup();
    const props = makeProps({
      replyTo: {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-2',
        content: 'original message',
        encryptedContent: null,
        isEncrypted: false,
        messageType: 'text',
        replyToId: null,
        replyTo: null,
        isPinned: false,
        isEdited: false,
        deletedAt: null,
        metadata: {},
        reactions: [],
        sender: {
          id: 'user-2',
          username: 'ada',
          displayName: 'Ada',
          avatarUrl: null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(<MessageInputArea {...props} inputContainerRef={createRef<HTMLDivElement>()} />);

    expect(sharedInputMock.props?.replyTo).toEqual({
      id: 'msg-1',
      author: 'Ada',
      content: 'original message',
    });

    await user.click(screen.getByRole('button', { name: /cancel reply/i }));

    expect(props.onClearReply).toHaveBeenCalled();
  });
});
