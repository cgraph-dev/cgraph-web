import {
  shouldUseMultipartMessageUpload,
  type UploadedMessageAttachment,
} from '@cgraph-dev/shared-types';
import { http } from '@/lib/api-client';

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const EXPIRED_CAPABILITY_STATUSES = new Set([401, 403]);

interface PrivateUploadOptions {
  readonly isPaid: boolean;
  readonly isViewOnce: boolean;
}

interface PrivateUploadedAttachment extends UploadedMessageAttachment {
  readonly checksum?: string;
}

interface DeliveryPayload {
  readonly upload_id: string;
  readonly url: string;
  readonly expires_at: string;
  readonly filename: string;
  readonly content_type: string;
  readonly size: number;
  readonly checksum: string;
}

export interface CloudChatAttachmentRequest {
  readonly conversationId: string;
  readonly messageId: string;
  readonly uploadId: string;
  readonly checksum?: string;
  readonly size?: number;
  readonly signal?: AbortSignal;
}

export interface VerifiedCloudChatAttachment {
  readonly objectUrl: string;
  readonly filename: string;
  readonly contentType: string;
  readonly size: number;
  readonly checksum: string;
  readonly expiresAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Attachment delivery omitted ${field}`);
  }

  return value;
}

function requiredNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Attachment delivery omitted ${field}`);
  }

  return value;
}

function parseDelivery(responseData: unknown): DeliveryPayload {
  const envelope = isRecord(responseData) ? responseData : null;
  const data = envelope && isRecord(envelope.data) ? envelope.data : null;

  if (!data) throw new Error('Attachment delivery response was invalid');

  const checksum = requiredString(data.checksum, 'checksum').toLowerCase();
  if (!SHA256_PATTERN.test(checksum)) {
    throw new Error('Attachment delivery returned an invalid checksum');
  }

  return {
    upload_id: requiredString(data.upload_id, 'upload identity'),
    url: requiredString(data.url, 'URL'),
    expires_at: requiredString(data.expires_at, 'expiry'),
    filename: requiredString(data.filename, 'filename'),
    content_type: requiredString(data.content_type, 'content type'),
    size: requiredNumber(data.size, 'size'),
    checksum,
  };
}

async function requestDelivery(request: CloudChatAttachmentRequest): Promise<DeliveryPayload> {
  const response = await http.get(
    `/api/v1/conversations/${request.conversationId}/messages/${request.messageId}/attachment`,
    { signal: request.signal }
  );
  return parseDelivery(response.data);
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return bytesToHex(digest);
}

function expectedChecksum(request: CloudChatAttachmentRequest, delivery: DeliveryPayload): string {
  const expected = request.checksum?.toLowerCase() ?? delivery.checksum;

  if (!SHA256_PATTERN.test(expected) || expected !== delivery.checksum) {
    throw new Error('Attachment integrity metadata does not match delivery');
  }

  return expected;
}

async function fetchVerified(
  request: CloudChatAttachmentRequest,
  delivery: DeliveryPayload
): Promise<VerifiedCloudChatAttachment | null> {
  if (delivery.upload_id !== request.uploadId) {
    throw new Error('Attachment delivery identity does not match the message');
  }

  if (request.size !== undefined && request.size !== delivery.size) {
    throw new Error('Attachment size metadata does not match delivery');
  }

  const checksum = expectedChecksum(request, delivery);
  const response = await fetch(delivery.url, { credentials: 'omit', signal: request.signal });

  if (!response.ok) {
    if (EXPIRED_CAPABILITY_STATUSES.has(response.status)) return null;
    throw new Error(`Attachment download failed with ${response.status}`);
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== delivery.size) {
    throw new Error('Attachment download size did not match delivery metadata');
  }

  if ((await sha256(bytes)) !== checksum) {
    throw new Error('Attachment checksum verification failed');
  }

  const blob = new Blob([bytes], { type: delivery.content_type });

  return {
    objectUrl: URL.createObjectURL(blob),
    filename: delivery.filename,
    contentType: delivery.content_type,
    size: delivery.size,
    checksum,
    expiresAt: delivery.expires_at,
  };
}

/** Selects the private single-part path without changing deferred compatibility owners. */
export function shouldUsePrivateCloudChatAttachment(
  file: File,
  options: PrivateUploadOptions
): boolean {
  return !options.isPaid && !options.isViewOnce && !shouldUseMultipartMessageUpload(file.size);
}

/** Builds local-only optimistic metadata for an opaque private upload. */
export function buildPrivateCloudChatAttachmentMetadata(
  uploaded: PrivateUploadedAttachment,
  localPreviewUrl: string
): Record<string, unknown> {
  if (!uploaded.uploadId || !uploaded.checksum || !SHA256_PATTERN.test(uploaded.checksum)) {
    throw new Error('Private upload is missing durable identity or integrity metadata');
  }

  return {
    uploadId: uploaded.uploadId,
    filename: uploaded.filename,
    size: uploaded.size,
    mimeType: uploaded.contentType,
    checksum: uploaded.checksum,
    localPreviewUrl,
  };
}

/** Renews once after an expired capability and returns only verified local bytes. */
export async function loadCloudChatAttachment(
  request: CloudChatAttachmentRequest
): Promise<VerifiedCloudChatAttachment> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const delivery = await requestDelivery(request);
    const verified = await fetchVerified(request, delivery);
    if (verified) return verified;
  }

  throw new Error('Attachment delivery capability expired twice');
}
