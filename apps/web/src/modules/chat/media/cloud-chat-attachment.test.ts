import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES } from '@cgraph-dev/shared-types';
import { http } from '@/lib/api-client';
import {
  buildPrivateCloudChatAttachmentMetadata,
  loadCloudChatAttachment,
  shouldUsePrivateCloudChatAttachment,
} from './cloud-chat-attachment';

vi.mock('@/lib/api-client', () => ({
  http: { get: vi.fn() },
}));

const bytes = new TextEncoder().encode('verified attachment');
const checksum = createHash('sha256').update(bytes).digest('hex');
const createObjectUrl = vi.fn(() => 'blob:verified-attachment');

function delivery(url: string) {
  return {
    data: {
      data: {
        upload_id: 'upload-1',
        url,
        expires_at: '2026-07-14T20:00:00Z',
        filename: 'proof.txt',
        content_type: 'text/plain',
        size: bytes.byteLength,
        checksum,
      },
    },
  };
}

function fetchResponse(status = 200, body = bytes): Pick<Response, 'ok' | 'status' | 'arrayBuffer'> {
  return {
    ok: status >= 200 && status < 300,
    status,
    arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
  };
}

describe('Cloud Chat attachment lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
  });

  it('selects only ordinary single-part attachments for private storage', () => {
    const small = new File(['small'], 'small.txt', { type: 'text/plain' });
    const large = new File(
      [new Uint8Array(MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES + 1)],
      'large.bin'
    );

    expect(
      shouldUsePrivateCloudChatAttachment(small, { isPaid: false, isViewOnce: false })
    ).toBe(true);
    expect(
      shouldUsePrivateCloudChatAttachment(small, { isPaid: true, isViewOnce: false })
    ).toBe(false);
    expect(
      shouldUsePrivateCloudChatAttachment(small, { isPaid: false, isViewOnce: true })
    ).toBe(false);
    expect(
      shouldUsePrivateCloudChatAttachment(large, { isPaid: false, isViewOnce: false })
    ).toBe(false);
  });

  it('builds URL-free transport metadata with a local optimistic preview', () => {
    const metadata = buildPrivateCloudChatAttachmentMetadata(
      {
        uploadId: 'upload-1',
        url: '/api/v1/files/upload-1',
        filename: 'proof.txt',
        contentType: 'text/plain',
        size: bytes.byteLength,
        thumbnailUrl: null,
        checksum,
      },
      'blob:local-preview'
    );

    expect(metadata).toMatchObject({
      uploadId: 'upload-1',
      checksum,
      localPreviewUrl: 'blob:local-preview',
    });
    expect(metadata).not.toHaveProperty('url');
    expect(metadata).not.toHaveProperty('fileUrl');
  });

  it('renews delivery and renders only bytes that pass size and SHA-256 verification', async () => {
    vi.mocked(http.get).mockResolvedValue(delivery('https://objects.example/first'));
    vi.mocked(fetch).mockResolvedValue(fetchResponse() as Response);

    const loaded = await loadCloudChatAttachment({
      conversationId: 'conversation-1',
      messageId: 'message-1',
      uploadId: 'upload-1',
      checksum,
      size: bytes.byteLength,
    });

    expect(http.get).toHaveBeenCalledWith(
      '/api/v1/conversations/conversation-1/messages/message-1/attachment',
      { signal: undefined }
    );
    expect(fetch).toHaveBeenCalledWith('https://objects.example/first', {
      credentials: 'omit',
      signal: undefined,
    });
    expect(loaded).toMatchObject({
      objectUrl: 'blob:verified-attachment',
      checksum,
      size: bytes.byteLength,
    });
  });

  it('renews once after an expired object capability', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce(delivery('https://objects.example/expired'))
      .mockResolvedValueOnce(delivery('https://objects.example/fresh'));
    vi.mocked(fetch)
      .mockResolvedValueOnce(fetchResponse(403) as Response)
      .mockResolvedValueOnce(fetchResponse() as Response);

    await expect(
      loadCloudChatAttachment({
        conversationId: 'conversation-1',
        messageId: 'message-1',
        uploadId: 'upload-1',
        checksum,
      })
    ).resolves.toMatchObject({ objectUrl: 'blob:verified-attachment' });

    expect(http.get).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('stops after one renewal when both object capabilities are expired', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce(delivery('https://objects.example/expired-first'))
      .mockResolvedValueOnce(delivery('https://objects.example/expired-second'));
    vi.mocked(fetch)
      .mockResolvedValueOnce(fetchResponse(403) as Response)
      .mockResolvedValueOnce(fetchResponse(403) as Response);

    await expect(
      loadCloudChatAttachment({
        conversationId: 'conversation-1',
        messageId: 'message-1',
        uploadId: 'upload-1',
        checksum,
      })
    ).rejects.toThrow('Attachment delivery capability expired twice');

    expect(http.get).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('rejects a delivery bound to a different upload before downloading bytes', async () => {
    vi.mocked(http.get).mockResolvedValue(delivery('https://objects.example/wrong-upload'));

    await expect(
      loadCloudChatAttachment({
        conversationId: 'conversation-1',
        messageId: 'message-1',
        uploadId: 'upload-other',
        checksum,
      })
    ).rejects.toThrow('Attachment delivery identity does not match the message');

    expect(fetch).not.toHaveBeenCalled();
    expect(createObjectUrl).not.toHaveBeenCalled();
  });

  it('rejects modified bytes before creating a local object URL', async () => {
    vi.mocked(http.get).mockResolvedValue(delivery('https://objects.example/modified'));
    vi.mocked(fetch).mockResolvedValue(fetchResponse(200, new TextEncoder().encode('modified')) as Response);

    await expect(
      loadCloudChatAttachment({
        conversationId: 'conversation-1',
        messageId: 'message-1',
        uploadId: 'upload-1',
        checksum,
      })
    ).rejects.toThrow(/size|checksum/u);

    expect(createObjectUrl).not.toHaveBeenCalled();
  });
});
