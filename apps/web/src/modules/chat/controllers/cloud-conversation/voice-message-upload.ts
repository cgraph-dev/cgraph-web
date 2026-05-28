import { http } from '@/lib/api-client';

export interface VoiceRecordingData {
  blob: Blob;
  duration: number;
  waveform: number[];
}

export interface UploadedVoiceMessage {
  id: string | null;
  url: string;
  duration: number;
  waveform: number[];
  contentType: string;
  size: number;
  messageId: string | null;
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

function numberArrayValue(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;

  const numbers = value.filter((item): item is number => typeof item === 'number');
  return numbers.length === value.length ? numbers : null;
}

function uploadMimeType(blob: Blob): string {
  if (blob.type.startsWith('audio/webm')) return 'audio/webm';
  return blob.type || 'audio/webm';
}

function uploadFilename(mimeType: string): string {
  if (mimeType === 'audio/ogg') return 'voice-message.ogg';
  if (mimeType === 'audio/mp4' || mimeType === 'audio/m4a' || mimeType === 'audio/x-m4a') {
    return 'voice-message.m4a';
  }
  if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') return 'voice-message.mp3';
  if (mimeType === 'audio/wav') return 'voice-message.wav';
  return 'voice-message.webm';
}

/** Uploads a recorded voice blob and returns message metadata for the routed DM send flow. */
export async function uploadVoiceMessage(
  conversationId: string,
  recording: VoiceRecordingData
): Promise<UploadedVoiceMessage> {
  const mimeType = uploadMimeType(recording.blob);
  const audioFile = new File([recording.blob], uploadFilename(mimeType), { type: mimeType });
  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('conversation_id', conversationId);
  formData.append('duration', String(recording.duration));
  formData.append('waveform', JSON.stringify(recording.waveform));

  const response = await http.post('/api/v1/voice-messages', formData);
  const data = isRecord(response.data) && isRecord(response.data.data) ? response.data.data : null;
  const url = stringValue(data?.url);

  if (!data || !url) {
    throw new Error('Voice message response did not include a playback URL');
  }

  return {
    id: stringValue(data.id),
    url,
    duration: numberValue(data.duration) ?? recording.duration,
    waveform: numberArrayValue(data.waveform) ?? recording.waveform,
    contentType: stringValue(data.content_type) ?? mimeType,
    size: numberValue(data.size) ?? recording.blob.size,
    messageId: stringValue(data.message_id),
  };
}
