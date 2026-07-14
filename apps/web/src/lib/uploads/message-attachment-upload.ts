import {
  MESSAGE_UPLOAD_MAX_PARALLEL_PARTS,
  MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES,
  getMessageUploadBlockReason,
  multipartUploadProgress,
  shouldUseMultipartMessageUpload,
  type MultipartUploadCompletedPart,
  type MultipartUploadPart,
  type UploadedMessageAttachment,
} from '@cgraph-dev/shared-types';
import { apiClient, http } from '@/lib/api-client';

interface UploadMessageAttachmentOptions {
  readonly context?: string;
  readonly signal?: AbortSignal;
  readonly onProgress?: (progress: number) => void;
}

export interface MessageAttachmentUpload extends UploadedMessageAttachment {
  readonly checksum?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function contentTypeFor(file: File): string {
  return file.type || 'application/octet-stream';
}

function uploadBlockedMessage(reason: ReturnType<typeof getMessageUploadBlockReason>): string {
  if (reason === 'blocked_extension') {
    return 'This file extension is not allowed for security reasons.';
  }

  if (reason === 'blocked_content_type') {
    return 'This file type is not allowed for security reasons.';
  }

  return 'This file cannot be uploaded.';
}

function assertAllowedMessageUpload(file: File): void {
  const reason = getMessageUploadBlockReason(file.name, contentTypeFor(file));
  if (reason) {
    throw new Error(uploadBlockedMessage(reason));
  }
}

function uploadedAttachmentFromResponse(
  data: Record<string, unknown>,
  file: File
): MessageAttachmentUpload {
  const url = stringValue(data.url);

  if (!url) {
    throw new Error('Upload response did not include a file URL');
  }

  return {
    uploadId: stringValue(data.id) ?? undefined,
    url,
    filename: stringValue(data.original_filename) ?? stringValue(data.filename) ?? file.name,
    contentType: stringValue(data.content_type) ?? contentTypeFor(file),
    size: numberValue(data.size) ?? file.size,
    thumbnailUrl: stringValue(data.thumbnail_url),
    checksum: stringValue(data.checksum) ?? undefined,
  };
}

async function uploadSinglePartAttachment(
  file: File,
  context: string,
  signal: AbortSignal | undefined,
  onProgress: (progress: number) => void
): Promise<MessageAttachmentUpload> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('context', context);

  const response = await http.post('/api/v1/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
    onUploadProgress: (event) => {
      if (!event.total) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });

  const data = isRecord(response.data) && isRecord(response.data.data) ? response.data.data : null;

  if (!data) {
    throw new Error('Upload response did not include file data');
  }

  const uploaded = uploadedAttachmentFromResponse(data, file);

  if (context === 'cloud_chat' && (!uploaded.uploadId || !uploaded.checksum)) {
    throw new Error('Private upload response did not include durable identity and integrity data');
  }

  onProgress(100);
  return uploaded;
}

function partBlob(file: File, partNumber: number): Blob {
  const start = (partNumber - 1) * MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES;
  const end = Math.min(start + MESSAGE_UPLOAD_MULTIPART_PART_SIZE_BYTES, file.size);
  return file.slice(start, end);
}

function readEtag(xhr: XMLHttpRequest): string {
  const etag = xhr.getResponseHeader('ETag') ?? xhr.getResponseHeader('etag');
  if (!etag) {
    throw new Error('Upload part completed without an ETag header');
  }
  return etag;
}

function uploadPart(
  part: MultipartUploadPart,
  blob: Blob,
  contentType: string,
  signal: AbortSignal | undefined,
  onProgress: (loadedBytes: number) => void
): Promise<MultipartUploadCompletedPart> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      callback();
    };

    xhr.open('PUT', part.presigned_url);
    xhr.setRequestHeader('Content-Type', contentType);

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      onProgress(event.loaded);
    });

    xhr.addEventListener('load', () => {
      finish(() => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve({ part_number: part.part_number, etag: readEtag(xhr) });
          } catch (error) {
            reject(error);
          }
          return;
        }

        reject(new Error(`Upload part ${part.part_number} failed with ${xhr.status}`));
      });
    });

    xhr.addEventListener('error', () => {
      finish(() => reject(new Error(`Upload part ${part.part_number} failed`)));
    });

    xhr.addEventListener('abort', () => {
      finish(() => reject(new Error('Upload cancelled')));
    });

    signal?.addEventListener(
      'abort',
      () => {
        xhr.abort();
      },
      { once: true }
    );

    xhr.send(blob);
  });
}

async function uploadPartWithRetry(
  uploadId: string,
  part: MultipartUploadPart,
  file: File,
  contentType: string,
  signal: AbortSignal | undefined,
  onProgress: (loadedBytes: number) => void
): Promise<MultipartUploadCompletedPart> {
  let current = part;
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await uploadPart(
        current,
        partBlob(file, current.part_number),
        contentType,
        signal,
        onProgress
      );
    } catch (error) {
      lastError = error;
      if (signal?.aborted || attempt === 2) break;

      const retryUrl = await apiClient.upload.presignMultipartPart(uploadId, part.part_number);
      if (!retryUrl.ok) break;
      current = { ...part, presigned_url: retryUrl.data.presigned_url };
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Upload part ${part.part_number} failed`);
}

async function uploadPartsInParallel(
  uploadId: string,
  parts: ReadonlyArray<MultipartUploadPart>,
  file: File,
  signal: AbortSignal | undefined,
  onProgress: (progress: number) => void
): Promise<ReadonlyArray<MultipartUploadCompletedPart>> {
  const completed: MultipartUploadCompletedPart[] = [];
  const inFlightBytes = new Map<number, number>();
  let completedBytes = 0;
  let nextIndex = 0;

  const updateProgress = () => {
    const loadedInFlight = [...inFlightBytes.values()].reduce((sum, bytes) => sum + bytes, 0);
    onProgress(multipartUploadProgress(completedBytes, loadedInFlight, file.size));
  };

  const worker = async () => {
    while (nextIndex < parts.length) {
      const part = parts[nextIndex];
      nextIndex += 1;

      if (!part) return;

      const blob = partBlob(file, part.part_number);
      const result = await uploadPartWithRetry(
        uploadId,
        part,
        file,
        contentTypeFor(file),
        signal,
        (loadedBytes) => {
          inFlightBytes.set(part.part_number, loadedBytes);
          updateProgress();
        }
      );

      inFlightBytes.delete(part.part_number);
      completedBytes += blob.size;
      completed.push(result);
      updateProgress();
    }
  };

  const workerCount = Math.min(MESSAGE_UPLOAD_MAX_PARALLEL_PARTS, parts.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return completed.sort((a, b) => a.part_number - b.part_number);
}

async function uploadMultipartAttachment(
  file: File,
  context: string,
  signal: AbortSignal | undefined,
  onProgress: (progress: number) => void
): Promise<MessageAttachmentUpload> {
  const start = await apiClient.upload.startMultipartUpload({
    filename: file.name,
    content_type: contentTypeFor(file),
    size: file.size,
    context,
  });

  if (!start.ok) {
    throw new Error(start.error.message);
  }

  const completedParts = await uploadPartsInParallel(
    start.data.upload_id,
    start.data.parts,
    file,
    signal,
    (progress) => onProgress(Math.min(progress, 99))
  );

  const complete = await apiClient.upload.completeMultipartUpload({
    upload_id: start.data.upload_id,
    parts: completedParts,
  });

  if (!complete.ok) {
    throw new Error(complete.error.message);
  }

  onProgress(100);

  return {
    uploadId: complete.data.upload_id,
    url: complete.data.url,
    filename: file.name,
    contentType: contentTypeFor(file),
    size: file.size,
    thumbnailUrl: null,
  };
}

/** Uploads a message attachment through the regular or multipart path based on file size. */
export async function uploadMessageAttachment(
  file: File,
  options: UploadMessageAttachmentOptions = {}
): Promise<MessageAttachmentUpload> {
  assertAllowedMessageUpload(file);

  const context = options.context ?? 'message';
  const onProgress = options.onProgress ?? (() => undefined);

  if (shouldUseMultipartMessageUpload(file.size)) {
    if (context === 'cloud_chat') {
      throw new Error('Private Cloud Chat multipart uploads are not available yet');
    }

    return uploadMultipartAttachment(file, context, options.signal, onProgress);
  }

  return uploadSinglePartAttachment(file, context, options.signal, onProgress);
}
