import { describe, expect, it, vi, beforeEach } from 'vitest';
import { uploadVoiceMessage } from '../voice-message-upload';

const apiMocks = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    post: apiMocks.post,
  },
}));

describe('uploadVoiceMessage', () => {
  beforeEach(() => {
    apiMocks.post.mockReset();
  });

  it('posts normalized webm audio and conversation metadata to the voice endpoint', async () => {
    apiMocks.post.mockResolvedValueOnce({
      data: {
        data: {
          id: 'voice-1',
          url: '/uploads/voice/voice-1.ogg',
          duration: 2.4,
          waveform: [0.1, 0.4, 0.2],
          content_type: 'audio/ogg',
          size: 4096,
          message_id: 'msg-voice-1',
        },
      },
    });

    const recording = {
      blob: new Blob(['voice'], { type: 'audio/webm;codecs=opus' }),
      duration: 3,
      waveform: [0.2, 0.3],
    };

    const result = await uploadVoiceMessage('conv-1', recording);

    expect(apiMocks.post).toHaveBeenCalledWith('/api/v1/voice-messages', expect.any(FormData));
    const formData = apiMocks.post.mock.calls[0]?.[1] as FormData;
    const audio = formData.get('audio') as File;

    expect(formData.get('conversation_id')).toBe('conv-1');
    expect(formData.get('duration')).toBe('3');
    expect(formData.get('waveform')).toBe('[0.2,0.3]');
    expect(audio.name).toBe('voice-message.webm');
    expect(audio.type).toBe('audio/webm');
    expect(result).toEqual({
      id: 'voice-1',
      url: '/uploads/voice/voice-1.ogg',
      duration: 2.4,
      waveform: [0.1, 0.4, 0.2],
      contentType: 'audio/ogg',
      size: 4096,
      messageId: 'msg-voice-1',
    });
  });

  it('rejects malformed upload responses without a playback URL', async () => {
    apiMocks.post.mockResolvedValueOnce({ data: { data: { id: 'voice-1' } } });

    await expect(
      uploadVoiceMessage('conv-1', {
        blob: new Blob(['voice'], { type: 'audio/webm' }),
        duration: 1,
        waveform: [0.1],
      })
    ).rejects.toThrow('Voice message response did not include a playback URL');
  });
});
