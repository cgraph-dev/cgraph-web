import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES } from '@cgraph-dev/shared-types';
import { apiClient, http } from '@/lib/api-client';
import { uploadMessageAttachment } from '../message-attachment-upload';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    upload: {
      startMultipartUpload: vi.fn(),
      presignMultipartPart: vi.fn(),
      completeMultipartUpload: vi.fn(),
    },
  },
  http: {
    post: vi.fn(),
  },
}));

type Listener = (event?: unknown) => void;

class MockXMLHttpRequest {
  static sentBodies: Blob[] = [];

  readonly upload = {
    addEventListener: (type: string, listener: Listener) => {
      this.uploadListeners.set(type, listener);
    },
  };

  status = 200;
  readonly uploadListeners = new Map<string, Listener>();
  readonly listeners = new Map<string, Listener>();
  private url = '';

  open(_method: string, url: string): void {
    this.url = url;
  }

  setRequestHeader(): void {
    return undefined;
  }

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, listener);
  }

  getResponseHeader(name: string): string | null {
    if (name.toLowerCase() !== 'etag') return null;
    const part = this.url.endsWith('/2') ? '2' : '1';
    return `"etag-${part}"`;
  }

  send(body: BodyInit | null): void {
    if (body instanceof Blob) {
      MockXMLHttpRequest.sentBodies.push(body);
      this.uploadListeners.get('progress')?.({
        lengthComputable: true,
        loaded: body.size,
        total: body.size,
      });
    }

    this.listeners.get('load')?.();
  }

  abort(): void {
    this.listeners.get('abort')?.();
  }
}

describe('uploadMessageAttachment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockXMLHttpRequest.sentBodies = [];
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest);
  });

  it('uses the regular upload endpoint for small attachments', async () => {
    vi.mocked(http.post).mockImplementation(async (_url, _body, config) => {
      config?.onUploadProgress?.({ loaded: 10, total: 20 } as never);
      return {
        status: 201,
        data: {
          data: {
            id: 'upload-small',
            url: '/uploads/small.txt',
            original_filename: 'small.txt',
            content_type: 'text/plain',
            size: 10,
          },
        },
      };
    });

    const progress: number[] = [];
    const result = await uploadMessageAttachment(new File(['hello'], 'small.txt', { type: 'text/plain' }), {
      onProgress: (value) => progress.push(value),
    });

    expect(http.post).toHaveBeenCalledWith(
      '/api/v1/uploads',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
    );
    expect(result).toMatchObject({
      uploadId: 'upload-small',
      url: '/uploads/small.txt',
      filename: 'small.txt',
      contentType: 'text/plain',
      size: 10,
    });
    expect(progress).toContain(50);
    expect(progress.at(-1)).toBe(100);
  });

  it('rejects dangerous files before calling the upload API', async () => {
    await expect(
      uploadMessageAttachment(new File(['echo bad'], 'payload.ps1', { type: 'text/plain' }))
    ).rejects.toThrow('This file extension is not allowed');

    expect(http.post).not.toHaveBeenCalled();
    expect(apiClient.upload.startMultipartUpload).not.toHaveBeenCalled();
  });

  it('uses multipart direct uploads for large attachments', async () => {
    vi.mocked(apiClient.upload.startMultipartUpload).mockResolvedValue({
      ok: true,
      data: {
        upload_id: 'multipart-1',
        key: 'uploads/message/large.bin',
        expires_at: '2026-05-22T12:00:00Z',
        parts: [
          { part_number: 1, presigned_url: 'https://upload.example.test/1' },
          { part_number: 2, presigned_url: 'https://upload.example.test/2' },
        ],
      },
    });
    vi.mocked(apiClient.upload.completeMultipartUpload).mockResolvedValue({
      ok: true,
      data: {
        upload_id: 'multipart-1',
        key: 'uploads/message/large.bin',
        url: 'https://cdn.example.test/uploads/message/large.bin',
      },
    });

    const file = new File(
      [new Uint8Array(MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES + 3)],
      'large.bin',
      { type: 'application/octet-stream' }
    );
    const progress: number[] = [];

    const result = await uploadMessageAttachment(file, {
      onProgress: (value) => progress.push(value),
    });

    expect(apiClient.upload.startMultipartUpload).toHaveBeenCalledWith({
      filename: 'large.bin',
      content_type: 'application/octet-stream',
      size: file.size,
      context: 'message',
    });
    expect(MockXMLHttpRequest.sentBodies.map((blob) => blob.size)).toEqual([
      MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES,
      3,
    ]);
    expect(apiClient.upload.completeMultipartUpload).toHaveBeenCalledWith({
      upload_id: 'multipart-1',
      parts: [
        { part_number: 1, etag: '"etag-1"' },
        { part_number: 2, etag: '"etag-2"' },
      ],
    });
    expect(result).toMatchObject({
      uploadId: 'multipart-1',
      url: 'https://cdn.example.test/uploads/message/large.bin',
      filename: 'large.bin',
    });
    expect(progress.at(-1)).toBe(100);
  });
});
