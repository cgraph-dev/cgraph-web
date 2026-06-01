import { expect, test, type Page, type Route } from '@playwright/test';
import { createHash } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { Socket } from 'node:net';

const CONVERSATION_ID = '11111111-1111-4111-8111-111111111111';
const CURRENT_USER_ID = 'e2e-user';
const FRIEND_USER_ID = '33333333-3333-4333-8333-333333333333';
const ROOM_ID = 'routed-dm-webrtc-room';
const SOCKET_PORT = Number(process.env.PLAYWRIGHT_ROUTED_DM_WEBRTC_PORT ?? '18182');
const SOCKET_URL = `ws://127.0.0.1:${SOCKET_PORT}/socket`;
const ROUTED_DM_WEBRTC_PROOF_ENABLED = process.env.PLAYWRIGHT_ROUTED_DM_WEBRTC_PROOF === 'true';

type PhoenixMessage = [
  joinRef: string | null,
  ref: string | null,
  topic: string,
  event: string,
  payload: Record<string, unknown>,
];

type RoutedWebRtcProof = {
  mediaRequests: MediaStreamConstraints[];
  peerConnections: Array<{
    config: RTCConfiguration;
    addTrackKinds: string[];
    localDescriptions: RTCSessionDescriptionInit[];
    remoteDescriptions: RTCSessionDescriptionInit[];
    iceCandidates: RTCIceCandidateInit[];
    connectionStates: string[];
    remoteTrackKinds: string[];
  }>;
};

declare global {
  interface Window {
    __cgraphRoutedDmWebRtcProof?: RoutedWebRtcProof;
  }
}

const friendUser = {
  id: FRIEND_USER_ID,
  username: 'friend',
  displayName: 'Friend',
  avatarUrl: null,
  status: 'online',
};

const conversation = {
  id: CONVERSATION_ID,
  type: 'direct',
  conversationType: 'cloud',
  name: 'Browser Proof Chat',
  avatarUrl: null,
  participants: [
    {
      id: 'part-1',
      userId: CURRENT_USER_ID,
      nickname: null,
      isMuted: false,
      mutedUntil: null,
      joinedAt: '2026-01-01T00:00:00.000Z',
      user: {
        id: CURRENT_USER_ID,
        username: 'e2e-user',
        displayName: 'E2E User',
        avatarUrl: null,
        status: 'online',
      },
    },
    {
      id: 'part-2',
      userId: FRIEND_USER_ID,
      nickname: null,
      isMuted: false,
      mutedUntil: null,
      joinedAt: '2026-01-01T00:00:00.000Z',
      user: friendUser,
    },
  ],
  lastMessage: null,
  unreadCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function encodeWsTextFrame(data: string): Buffer {
  const payload = Buffer.from(data);
  const length = payload.byteLength;

  if (length < 126) {
    return Buffer.concat([Buffer.from([0x81, length]), payload]);
  }

  if (length <= 0xffff) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(length), 2);
  return Buffer.concat([header, payload]);
}

function decodeWsTextFrames(buffer: Buffer): { frames: string[]; rest: Buffer } {
  const frames: string[] = [];
  let offset = 0;

  while (buffer.byteLength - offset >= 2) {
    const firstByte = buffer[offset]!;
    const secondByte = buffer[offset + 1]!;
    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) !== 0;
    let length = secondByte & 0x7f;
    let cursor = offset + 2;

    if (length === 126) {
      if (buffer.byteLength - cursor < 2) break;
      length = buffer.readUInt16BE(cursor);
      cursor += 2;
    } else if (length === 127) {
      if (buffer.byteLength - cursor < 8) break;
      const bigLength = buffer.readBigUInt64BE(cursor);
      if (bigLength > BigInt(Number.MAX_SAFE_INTEGER)) break;
      length = Number(bigLength);
      cursor += 8;
    }

    const maskLength = masked ? 4 : 0;
    if (buffer.byteLength - cursor < maskLength + length) break;

    const mask = masked ? buffer.subarray(cursor, cursor + 4) : null;
    cursor += maskLength;
    const payload = Buffer.from(buffer.subarray(cursor, cursor + length));
    cursor += length;

    offset = cursor;

    if (opcode === 0x8) continue;
    if (opcode !== 0x1) continue;

    if (mask) {
      for (let index = 0; index < payload.byteLength; index += 1) {
        payload[index] = payload[index]! ^ mask[index % 4]!;
      }
    }

    frames.push(payload.toString('utf8'));
  }

  return { frames, rest: buffer.subarray(offset) };
}

class RoutedDmWebRtcSocketHarness {
  private server: Server | null = null;
  private readonly sockets = new Set<Socket>();
  private readonly joinedTopics = new Map<string, number>();
  private readonly pushedEvents = new Map<string, number>();
  private readonly lastFrames: string[] = [];
  private upgradeCount = 0;
  private frameCount = 0;

  async start(): Promise<void> {
    if (this.server) return;

    this.server = createServer();
    this.server.on('upgrade', (request, rawSocket) => {
      this.upgradeCount += 1;
      const socket = rawSocket as Socket;
      const key = request.headers['sec-websocket-key'];

      if (typeof key !== 'string') {
        socket.destroy();
        return;
      }

      const accept = createHash('sha1')
        .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
        .digest('base64');

      socket.write(
        [
          'HTTP/1.1 101 Switching Protocols',
          'Upgrade: websocket',
          'Connection: Upgrade',
          `Sec-WebSocket-Accept: ${accept}`,
          '',
          '',
        ].join('\r\n')
      );

      this.sockets.add(socket);
      let pending = Buffer.alloc(0);

      socket.on('data', (chunk) => {
        pending = Buffer.concat([pending, chunk]);
        const decoded = decodeWsTextFrames(pending);
        pending = decoded.rest;

        for (const frame of decoded.frames) {
          this.handleFrame(socket, frame);
        }
      });
      socket.on('close', () => this.sockets.delete(socket));
      socket.on('error', () => this.sockets.delete(socket));
    });

    await new Promise<void>((resolve) => {
      this.server!.listen(SOCKET_PORT, '127.0.0.1', resolve);
    });
  }

  async stop(): Promise<void> {
    for (const socket of this.sockets) {
      socket.destroy();
    }
    this.sockets.clear();
    this.joinedTopics.clear();
    this.pushedEvents.clear();

    await new Promise<void>((resolve) => {
      this.server?.close(() => resolve());
      if (!this.server) resolve();
    });

    this.server = null;
  }

  async waitForJoin(topic: string): Promise<void> {
    await expect
      .poll(() => this.joinedTopics.get(topic) ?? 0, {
        message: `${topic} should be joined: ${JSON.stringify(this.diagnostics())}`,
      })
      .toBeGreaterThanOrEqual(1);
  }

  async waitForPush(event: string): Promise<void> {
    await expect
      .poll(() => this.pushedEvents.get(event) ?? 0, {
        message: `${event} should be pushed: ${JSON.stringify(this.diagnostics())}`,
      })
      .toBeGreaterThanOrEqual(1);
  }

  diagnostics(): Record<string, unknown> {
    return {
      upgradeCount: this.upgradeCount,
      socketCount: this.sockets.size,
      frameCount: this.frameCount,
      joinedTopics: Object.fromEntries(this.joinedTopics),
      pushedEvents: Object.fromEntries(this.pushedEvents),
      lastFrames: this.lastFrames,
    };
  }

  private handleFrame(socket: Socket, frame: string): void {
    let message: PhoenixMessage;

    try {
      message = JSON.parse(frame) as PhoenixMessage;
    } catch {
      return;
    }

    const [joinRef, ref, topic, event] = message;
    this.frameCount += 1;
    this.lastFrames.push(`${topic}:${event}`);
    this.lastFrames.splice(0, Math.max(0, this.lastFrames.length - 12));

    if (event === 'heartbeat') {
      this.reply(socket, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]);
      return;
    }

    if (event === 'phx_join') {
      this.joinedTopics.set(topic, (this.joinedTopics.get(topic) ?? 0) + 1);
      const response =
        topic === `call:${ROOM_ID}`
          ? { ice_servers: this.iceServers() }
          : {};
      this.reply(socket, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response }]);

      if (topic === `call:${ROOM_ID}`) {
        setTimeout(() => {
          this.push(socket, topic, 'participant:joined', {
            participant_id: FRIEND_USER_ID,
            user_id: FRIEND_USER_ID,
            device: 'web',
            media: { audio: true, video: true },
          });
        }, 0);
      }
      return;
    }

    if (event === 'create_room') {
      this.recordPush(event);
      this.reply(socket, [
        joinRef,
        ref,
        topic,
        'phx_reply',
        {
          status: 'ok',
          response: {
            room_id: ROOM_ID,
            ice_servers: this.iceServers(),
          },
        },
      ]);
      return;
    }

    if (event === 'signal:offer') {
      this.recordPush(event);
      this.reply(socket, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]);
      setTimeout(() => {
        this.push(socket, topic, 'signal:answer', {
          from: FRIEND_USER_ID,
          sdp: { type: 'answer', sdp: 'routed-dm-answer' },
        });
      }, 0);
      return;
    }

    if (event === 'signal:ice_candidate') {
      this.recordPush(event);
      this.reply(socket, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]);
      return;
    }

    if (event === 'phx_leave') {
      this.reply(socket, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]);
    }
  }

  private iceServers(): RTCIceServer[] {
    return [
      {
        urls: 'turn:turn.cgraph.test:3478',
        username: 'turn-user',
        credential: 'turn-secret',
      },
    ];
  }

  private recordPush(event: string): void {
    this.pushedEvents.set(event, (this.pushedEvents.get(event) ?? 0) + 1);
  }

  private push(socket: Socket, topic: string, event: string, payload: Record<string, unknown>): void {
    socket.write(encodeWsTextFrame(JSON.stringify([null, null, topic, event, payload])));
  }

  private reply(socket: Socket, message: PhoenixMessage): void {
    socket.write(encodeWsTextFrame(JSON.stringify(message)));
  }
}

let socketHarness: RoutedDmWebRtcSocketHarness | null = null;

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installRoutedDmMocks(page: Page): Promise<void> {
  await page.route(`**/api/v1/users/${FRIEND_USER_ID}`, async (route, request) => {
    if (request.method() === 'GET') {
      await fulfillJson(route, { data: friendUser, ...friendUser });
      return;
    }

    await route.fallback();
  });

  await page.route('**/api/v1/conversations**', async (route, request) => {
    const url = new URL(request.url());

    if (request.method() === 'GET' && url.pathname === '/api/v1/conversations') {
      await fulfillJson(route, { data: [conversation], meta: { page: 1, total: 1 } });
      return;
    }

    await route.fallback();
  });

  await page.route(`**/api/v1/conversations/${CONVERSATION_ID}/messages**`, async (route) => {
    await fulfillJson(route, {
      data: [
        {
          id: 'msg-1',
          conversationId: CONVERSATION_ID,
          senderId: FRIEND_USER_ID,
          content: 'call proof setup',
          messageType: 'text',
          isEncrypted: false,
          isEdited: false,
          isPinned: false,
          replyToId: null,
          replyTo: null,
          deletedAt: null,
          metadata: {},
          reactions: [],
          sender: friendUser,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, total: 1, hasMore: false },
    });
  });

  await page.route(`**/api/v1/conversations/${CONVERSATION_ID}/read`, async (route) => {
    await fulfillJson(route, { data: {} });
  });

  await page.route(`**/api/v1/message-requests/${CONVERSATION_ID}`, async (route) => {
    await fulfillJson(route, { data: { status: 'accepted', conversation_id: CONVERSATION_ID } });
  });

  await page.route('**/api/v1/spaces**', async (route) => {
    await fulfillJson(route, { data: [] });
  });
}

async function installBrowserWebRtcProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const proof: RoutedWebRtcProof = {
      mediaRequests: [],
      peerConnections: [],
    };
    window.__cgraphRoutedDmWebRtcProof = proof;

    function makeSyntheticStream(label: string): MediaStream {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      const context = canvas.getContext('2d');
      if (!context || typeof canvas.captureStream !== 'function') {
        throw new Error('Browser does not support canvas captureStream');
      }

      context.fillStyle = label === 'local' ? '#7c3aed' : '#06b6d4';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#ffffff';
      context.fillText(label, 8, 24);

      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const destination = audioContext.createMediaStreamDestination();
      oscillator.frequency.value = label === 'local' ? 440 : 660;
      oscillator.connect(destination);
      oscillator.start();

      const videoTrack = canvas.captureStream(10).getVideoTracks()[0];
      const audioTrack = destination.stream.getAudioTracks()[0];
      if (!videoTrack || !audioTrack) {
        throw new Error('Could not create synthetic media tracks');
      }

      const stream = new MediaStream([audioTrack, videoTrack]);
      const originalStopVideo = videoTrack.stop.bind(videoTrack);
      videoTrack.stop = () => {
        originalStopVideo();
        oscillator.stop();
        void audioContext.close();
      };

      return stream;
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async (constraints: MediaStreamConstraints) => {
          proof.mediaRequests.push(constraints);
          return makeSyntheticStream('local');
        },
      },
    });

    class ProbePeerConnection {
      onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null = null;
      ontrack: ((event: RTCTrackEvent) => void) | null = null;
      onconnectionstatechange: (() => void) | null = null;
      connectionState: RTCPeerConnectionState = 'new';
      private readonly record: RoutedWebRtcProof['peerConnections'][number];
      private readonly senders: RTCRtpSender[] = [];

      constructor(config: RTCConfiguration) {
        this.record = {
          config,
          addTrackKinds: [],
          localDescriptions: [],
          remoteDescriptions: [],
          iceCandidates: [],
          connectionStates: ['new'],
          remoteTrackKinds: [],
        };
        proof.peerConnections.push(this.record);
      }

      addTrack(track: MediaStreamTrack): RTCRtpSender {
        this.record.addTrackKinds.push(track.kind);
        const sender = {
          track,
          replaceTrack: async (replacement: MediaStreamTrack | null) => {
            if (replacement) {
              this.record.addTrackKinds.push(`replace:${replacement.kind}`);
            }
          },
        } as RTCRtpSender;
        this.senders.push(sender);
        return sender;
      }

      getSenders(): RTCRtpSender[] {
        return this.senders;
      }

      async createOffer(): Promise<RTCSessionDescriptionInit> {
        return { type: 'offer', sdp: 'routed-dm-offer' };
      }

      async createAnswer(): Promise<RTCSessionDescriptionInit> {
        return { type: 'answer', sdp: 'routed-dm-local-answer' };
      }

      async setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
        this.record.localDescriptions.push(description);
        queueMicrotask(() => {
          this.onicecandidate?.({
            candidate: {
              toJSON: () => ({ candidate: 'routed-dm-candidate' }),
            },
          } as RTCPeerConnectionIceEvent);
        });
      }

      async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
        this.record.remoteDescriptions.push(description);
        if (description.type === 'answer') {
          const remoteStream = makeSyntheticStream('remote');
          const remoteTrackKinds = remoteStream.getTracks().map((track) => track.kind);
          this.record.remoteTrackKinds.push(...remoteTrackKinds);
          this.ontrack?.({ streams: [remoteStream], track: remoteStream.getTracks()[0] } as RTCTrackEvent);
          this.connectionState = 'connected';
          this.record.connectionStates.push('connected');
          this.onconnectionstatechange?.();
        }
      }

      async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        this.record.iceCandidates.push(candidate);
      }

      close(): void {
        this.connectionState = 'closed';
        this.record.connectionStates.push('closed');
      }
    }

    function ProbeSessionDescription(description: RTCSessionDescriptionInit) {
      return description;
    }

    function ProbeIceCandidate(candidate: RTCIceCandidateInit) {
      return candidate;
    }

    window.RTCPeerConnection = ProbePeerConnection as unknown as typeof RTCPeerConnection;
    window.RTCSessionDescription =
      ProbeSessionDescription as unknown as typeof RTCSessionDescription;
    window.RTCIceCandidate = ProbeIceCandidate as unknown as typeof RTCIceCandidate;
  });
}

test.describe.serial('Routed DM WebRTC negotiation', () => {
  test.beforeAll(async () => {
    socketHarness = new RoutedDmWebRtcSocketHarness();
    await socketHarness.start();
  });

  test.afterAll(async () => {
    await socketHarness?.stop();
    socketHarness = null;
  });

  test('drives media acquisition, signaling, offer, answer, ICE, and connected state from the DM call route', async ({
    page,
  }) => {
    test.skip(
      !ROUTED_DM_WEBRTC_PROOF_ENABLED,
      'Set PLAYWRIGHT_ROUTED_DM_WEBRTC_PROOF=true and VITE_SOCKET_URL to the local WebRTC harness URL.'
    );
    test.skip(
      (process.env.VITE_SOCKET_URL ?? process.env.VITE_WS_URL) !== SOCKET_URL,
      `Set VITE_SOCKET_URL=${SOCKET_URL} for this routed DM WebRTC proof.`
    );

    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await installRoutedDmMocks(page);
    await installBrowserWebRtcProbe(page);

    await page.goto(`/messages/${CONVERSATION_ID}`);
    await page.getByRole('button', { name: /start video call/i }).click();

    await expect(page).toHaveURL(new RegExp(`/call/${FRIEND_USER_ID}/video$`));
    await socketHarness!.waitForJoin('webrtc:lobby');
    await socketHarness!.waitForJoin(`call:${ROOM_ID}`);
    await socketHarness!.waitForPush('create_room');
    await socketHarness!.waitForPush('signal:offer');
    await socketHarness!.waitForPush('signal:ice_candidate');
    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              window.__cgraphRoutedDmWebRtcProof?.peerConnections[0]?.connectionStates.includes(
                'connected'
              ) ?? false
          ),
        { message: 'routed DM peer connection reached connected state' }
      )
      .toBe(true);

    await expect(page.getByText('You').first()).toBeVisible();
    await expect(page.getByText('Friend').first()).toBeVisible();

    const proof = await page.evaluate(() => window.__cgraphRoutedDmWebRtcProof);
    expect(proof, JSON.stringify({ harness: socketHarness!.diagnostics(), pageErrors })).toBeTruthy();
    expect(proof!.mediaRequests).toContainEqual({ audio: true, video: true });
    expect(proof!.peerConnections).toHaveLength(1);

    const [peer] = proof!.peerConnections;
    expect(peer!.config.iceServers).toContainEqual({
      urls: 'turn:turn.cgraph.test:3478',
      username: 'turn-user',
      credential: 'turn-secret',
    });
    expect(peer!.addTrackKinds).toEqual(expect.arrayContaining(['audio', 'video']));
    expect(peer!.localDescriptions).toContainEqual({ type: 'offer', sdp: 'routed-dm-offer' });
    expect(peer!.remoteDescriptions).toContainEqual({ type: 'answer', sdp: 'routed-dm-answer' });
    expect(peer!.connectionStates).toContain('connected');
    expect(peer!.remoteTrackKinds.sort()).toEqual(['audio', 'video']);
    expect(pageErrors).toEqual([]);
  });
});
