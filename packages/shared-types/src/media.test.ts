import { describe, expect, it } from 'vitest';
import {
  buildMessageAttachmentMetadata,
  buildMessageAttachmentSendPayload,
  MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES,
  multipartUploadProgress,
  messageContentTypeForMime,
  shouldUseMultipartMessageUpload,
} from './media';

describe('message attachment contract', () => {
  it('maps MIME types and filenames to routed message content types', () => {
    expect(messageContentTypeForMime('image/png')).toBe('image');
    expect(messageContentTypeForMime('video/mp4')).toBe('video');
    expect(messageContentTypeForMime('audio/ogg')).toBe('audio');
    expect(messageContentTypeForMime('', 'photo.webp')).toBe('image');
    expect(messageContentTypeForMime('', 'archive.zip')).toBe('file');
  });

  it('builds one upload-first metadata shape for DM and group sends', () => {
    const uploaded = {
      url: '/uploads/file.png',
      filename: 'file.png',
      contentType: 'image/png',
      size: 42,
      thumbnailUrl: '/uploads/file-thumb.png',
    };

    expect(buildMessageAttachmentMetadata(uploaded)).toEqual({
      fileUrl: '/uploads/file.png',
      fileName: 'file.png',
      fileSize: 42,
      fileMimeType: 'image/png',
      url: '/uploads/file.png',
      filename: 'file.png',
      size: 42,
      mimeType: 'image/png',
      thumbnailUrl: '/uploads/file-thumb.png',
    });

    expect(buildMessageAttachmentSendPayload(uploaded)).toMatchObject({
      contentType: 'image',
      fileUrl: '/uploads/file.png',
      fileName: 'file.png',
      fileSize: 42,
      fileMimeType: 'image/png',
      thumbnailUrl: '/uploads/file-thumb.png',
    });
  });

  it('defines the shared multipart threshold and progress math', () => {
    expect(shouldUseMultipartMessageUpload(MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES)).toBe(false);
    expect(shouldUseMultipartMessageUpload(MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES + 1)).toBe(
      true
    );

    expect(multipartUploadProgress(5, 2, 10)).toBe(70);
    expect(multipartUploadProgress(100, 100, 10)).toBe(100);
    expect(multipartUploadProgress(1, 1, 0)).toBe(0);
  });
});
