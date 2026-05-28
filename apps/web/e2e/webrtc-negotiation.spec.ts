import { expect, test } from '@playwright/test';

test.describe('WebRTC browser negotiation', () => {
  test('connects two browser peers and exchanges audio/video tracks', async ({ page }) => {
    await page.goto('/messages');

    const result = await page.evaluate(async () => {
      const waitFor = async (predicate: () => boolean, label: string) => {
        const startedAt = Date.now();
        while (Date.now() - startedAt < 10_000) {
          if (predicate()) return;
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        throw new Error(`Timed out waiting for ${label}`);
      };

      const createMediaStream = (label: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const context = canvas.getContext('2d');
        if (!context || typeof canvas.captureStream !== 'function') {
          throw new Error('Browser does not support canvas captureStream');
        }

        context.fillStyle = label === 'caller' ? '#7c3aed' : '#06b6d4';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#ffffff';
        context.fillText(label, 8, 24);

        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const destination = audioContext.createMediaStreamDestination();
        oscillator.frequency.value = label === 'caller' ? 440 : 660;
        oscillator.connect(destination);
        oscillator.start();

        const videoTrack = canvas.captureStream(10).getVideoTracks()[0];
        const audioTrack = destination.stream.getAudioTracks()[0];
        if (!videoTrack || !audioTrack) {
          throw new Error('Could not create synthetic media tracks');
        }

        return {
          stream: new MediaStream([audioTrack, videoTrack]),
          cleanup: () => {
            oscillator.stop();
            audioTrack.stop();
            videoTrack.stop();
            void audioContext.close();
          },
        };
      };

      const caller = new RTCPeerConnection({ iceServers: [] });
      const callee = new RTCPeerConnection({ iceServers: [] });
      const callerMedia = createMediaStream('caller');
      const calleeMedia = createMediaStream('callee');
      const callerRemoteKinds: string[] = [];
      const calleeRemoteKinds: string[] = [];
      const iceErrors: string[] = [];

      caller.onicecandidate = (event) => {
        if (event.candidate) {
          void callee.addIceCandidate(event.candidate).catch((error: unknown) => {
            iceErrors.push(error instanceof Error ? error.message : String(error));
          });
        }
      };
      callee.onicecandidate = (event) => {
        if (event.candidate) {
          void caller.addIceCandidate(event.candidate).catch((error: unknown) => {
            iceErrors.push(error instanceof Error ? error.message : String(error));
          });
        }
      };
      caller.ontrack = (event) => {
        callerRemoteKinds.push(event.track.kind);
      };
      callee.ontrack = (event) => {
        calleeRemoteKinds.push(event.track.kind);
      };

      try {
        callerMedia.stream.getTracks().forEach((track) => caller.addTrack(track, callerMedia.stream));
        calleeMedia.stream.getTracks().forEach((track) => callee.addTrack(track, calleeMedia.stream));

        const offer = await caller.createOffer();
        await caller.setLocalDescription(offer);
        await callee.setRemoteDescription(offer);
        const answer = await callee.createAnswer();
        await callee.setLocalDescription(answer);
        await caller.setRemoteDescription(answer);

        await waitFor(
          () =>
            ['connected', 'completed'].includes(caller.iceConnectionState) &&
            ['connected', 'completed'].includes(callee.iceConnectionState),
          'ICE connection'
        );
        await waitFor(
          () =>
            callerRemoteKinds.includes('audio') &&
            callerRemoteKinds.includes('video') &&
            calleeRemoteKinds.includes('audio') &&
            calleeRemoteKinds.includes('video'),
          'remote audio/video tracks'
        );

        return {
          callerConnectionState: caller.connectionState,
          calleeConnectionState: callee.connectionState,
          callerIceConnectionState: caller.iceConnectionState,
          calleeIceConnectionState: callee.iceConnectionState,
          callerRemoteKinds: [...new Set(callerRemoteKinds)].sort(),
          calleeRemoteKinds: [...new Set(calleeRemoteKinds)].sort(),
          iceErrors,
        };
      } finally {
        caller.close();
        callee.close();
        callerMedia.cleanup();
        calleeMedia.cleanup();
      }
    });

    expect(result.iceErrors).toEqual([]);
    expect(result.callerRemoteKinds).toEqual(['audio', 'video']);
    expect(result.calleeRemoteKinds).toEqual(['audio', 'video']);
    expect(['connected', 'closed']).toContain(result.callerConnectionState);
    expect(['connected', 'closed']).toContain(result.calleeConnectionState);
    expect(['connected', 'completed', 'closed']).toContain(result.callerIceConnectionState);
    expect(['connected', 'completed', 'closed']).toContain(result.calleeIceConnectionState);
  });
});
