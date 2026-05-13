import { useState, useEffect, useRef } from 'react';

const TYPING_DEBOUNCE_MS = 2000;
const TYPING_EXPIRE_MS = 5000;

interface TypingUser {
  readonly userId: string;
  readonly username: string;
}

interface ChannelLike {
  push: (event: string, payload?: object) => void;
  on: (event: string, cb: (payload: unknown) => void) => number;
  off: (event: string, ref?: number) => void;
}

interface TypingPayload {
  user_id: string;
  username: string;
  is_typing: boolean;
}

interface StopTypingPayload {
  user_id: string;
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function isTypingPayload(val: unknown): val is TypingPayload {
  return isRecord(val) && typeof val['user_id'] === 'string' && typeof val['username'] === 'string';
}

function isStopTypingPayload(val: unknown): val is StopTypingPayload {
  return isRecord(val) && typeof val['user_id'] === 'string';
}

/** Use Typing Indicator. */
export function useTypingIndicator(channel: ChannelLike | null) {
  const [typingUsers, setTypingUsers] = useState<readonly TypingUser[]>([]);
  const lastSentRef = useRef(0);
  const expireTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function sendTyping() {
    const now = Date.now();
    if (!channel || now - lastSentRef.current < TYPING_DEBOUNCE_MS) return;
    lastSentRef.current = now;
    channel.push('typing', { is_typing: true });
  }

  function sendStopTyping() {
    if (!channel) return;
    lastSentRef.current = 0;
    channel.push('stop_typing', {});
  }

  useEffect(() => {
    if (!channel) return;
    const timers = expireTimers.current;

    const onTyping = (payload: unknown) => {
      if (!isTypingPayload(payload)) return;
      if (payload.is_typing === false) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.user_id));
        return;
      }

      setTypingUsers((prev) => {
        const filtered = prev.filter((u) => u.userId !== payload.user_id);
        return [...filtered, { userId: payload.user_id, username: payload.username }];
      });

      const existing = expireTimers.current.get(payload.user_id);
      if (existing) clearTimeout(existing);
      expireTimers.current.set(
        payload.user_id,
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.user_id));
          expireTimers.current.delete(payload.user_id);
        }, TYPING_EXPIRE_MS)
      );
    };

    const onStopTyping = (payload: unknown) => {
      if (!isStopTypingPayload(payload)) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.user_id));
      const timer = expireTimers.current.get(payload.user_id);
      if (timer) {
        clearTimeout(timer);
        expireTimers.current.delete(payload.user_id);
      }
    };

    const typingRef = channel.on('typing', onTyping);
    const stopRef = channel.on('user_stop_typing', onStopTyping);

    return () => {
      channel.off('typing', typingRef);
      channel.off('user_stop_typing', stopRef);
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, [channel]);

  return { typingUsers, sendTyping, sendStopTyping } as const;
}
