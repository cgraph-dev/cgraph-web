/**
 * QR Code Login page — scan from mobile to authenticate web sessions.
 *
 * Protocol flow:
 * 1. Request QR session from backend
 * 2. Display QR code with encoded session payload
 * 3. Subscribe to qr_auth:{session_id} WebSocket channel
 * 4. Wait for mobile to scan + approve
 * 5. Receive tokens via channel broadcast → store + redirect
 *
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Socket } from 'phoenix';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { getSocketUrl } from '@/lib/backend-url';
import { mapUserFromApi, useAuthStore } from '@/modules/auth/store';
import { createLogger } from '@/lib/logger';
import { isRecord } from '@/lib/api-utils/response-extractors';
import { FADE_IN } from '@/lib/animations/transitions';

const logger = createLogger('QrLogin');

// Types

type QrState = 'loading' | 'ready' | 'authenticated' | 'expired' | 'error';

interface QrSession {
  sessionId: string;
  qrPayload: string;
  expiresIn: number;
}

// Constants

const QR_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const QR_SIZE = 256;

function getExpiryMs(expiresInSeconds: number): number {
  return Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
    ? expiresInSeconds * 1000
    : QR_EXPIRY_MS;
}

function isExpiredJoinResponse(response: unknown): boolean {
  if (!isRecord(response)) return false;
  return response.reason === 'session_not_found_or_expired';
}

// Component

/** QR code login tab/section for the login page. */
export function QrLogin() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();

  const [state, setState] = useState<QrState>('loading');
  const [session, setSession] = useState<QrSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const channelRef = useRef<ReturnType<Socket['channel']> | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const disconnectChannel = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.leave();
      channelRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const handleAuthComplete = useCallback(
    (payload: { tokens: Record<string, string>; user: Record<string, unknown> }): void => {
      setState('authenticated');

      const { tokens, user } = payload;
      const mappedUser = typeof user.id === 'string' ? mapUserFromApi(user) : null;

      useAuthStore.setState({
        token: tokens.access_token ?? null,
        refreshToken: tokens.refresh_token ?? null,
        user: mappedUser,
        isAuthenticated: mappedUser !== null && Boolean(tokens.access_token),
      });

      disconnectChannel();
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);

      setTimeout(() => {
        navigate('/messages');
      }, 1200);
    },
    [disconnectChannel, navigate]
  );

  const connectToChannel = useCallback(
    (sessionId: string) => {
      disconnectChannel();

      const socketUrl = getSocketUrl();
      const socket = new Socket(socketUrl, {
        params: { qr_auth: 'true' },
        reconnectAfterMs: () => 5000,
      });

      socket.connect();
      socketRef.current = socket;

      const channel = socket.channel(`qr_auth:${sessionId}`, {});
      channelRef.current = channel;

      channel
        .join()
        .receive('ok', () => {
          logger.info('Joined QR auth channel:', sessionId);
        })
        .receive('error', (resp: unknown) => {
          logger.error('Failed to join QR auth channel:', resp);
          if (isExpiredJoinResponse(resp)) {
            setState('expired');
            setError(null);
            return;
          }
          setState('error');
          setError('Failed to connect. Please try again.');
        });

      channel.on('auth_complete', (payload: unknown) => {
        logger.info('QR auth complete — storing tokens');

        if (!isRecord(payload)) return;
        const rawTokens = payload.tokens;
        const rawUser = payload.user;
        if (!isRecord(rawTokens) || !isRecord(rawUser)) return;

        const tokenEntries = Object.entries(rawTokens);
        const tokens: Record<string, string> = {};
        for (const [k, v] of tokenEntries) {
          if (typeof v === 'string') tokens[k] = v;
        }

        handleAuthComplete({ tokens, user: rawUser });
      });
    },
    [disconnectChannel, handleAuthComplete]
  );

  const createSession = useCallback(async () => {
    setState('loading');
    setError(null);

    try {
      const result = await apiClient.auth.createQrSession();

      if (!result.ok || !result.data.qr_payload) {
        throw new Error(
          result.ok ? 'QR session response did not include a QR payload.' : result.error.message
        );
      }

      const data = result.data;
      const qrSession: QrSession = {
        sessionId: data.session_id,
        qrPayload: data.qr_payload,
        expiresIn: data.expires_in,
      };

      setSession(qrSession);
      setState('ready');

      // Connect to QR auth channel
      connectToChannel(qrSession.sessionId);

      // Set expiry timer
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = setTimeout(() => {
        setState('expired');
        disconnectChannel();
      }, getExpiryMs(qrSession.expiresIn));
    } catch (err) {
      logger.error('Failed to create QR session:', err);
      setError('Failed to create QR session. Please try again.');
      setState('error');
    }
  }, [connectToChannel, disconnectChannel]);

  useEffect(() => {
    void createSession();

    return () => {
      disconnectChannel();
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    };
  }, [createSession, disconnectChannel]);
  return (
    <div className="flex flex-col items-center gap-6">
      <AnimatePresence mode="wait">
        {/* Loading */}
        {state === 'loading' && (
          <motion.div
            key="loading"
            {...FADE_IN}
            exit={{ opacity: 0 }}
            className="flex h-[320px] w-[300px] items-center justify-center"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </motion.div>
        )}

        {/* QR Code Ready */}
        {state === 'ready' && session && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <QRCodeSVG value={session.qrPayload} size={QR_SIZE} level="M" includeMargin={false} />
            </div>
            <p className="max-w-[260px] text-center text-sm text-foreground-muted">
              {t(
                'login.qr_scan_instructions',
                'Open CGraph on your phone and scan this code to log in'
              )}
            </p>
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
              {t('login.qr_waiting', 'Waiting for scan...')}
            </div>
          </motion.div>
        )}

        {/* Authenticated */}
        {state === 'authenticated' && (
          <motion.div
            key="authenticated"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[320px] w-[300px] flex-col items-center justify-center gap-3"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-foreground">
              {t('login.qr_success', 'Login approved!')}
            </p>
            <p className="text-sm text-foreground-muted">
              {t('login.qr_redirecting', 'Redirecting...')}
            </p>
          </motion.div>
        )}

        {/* Expired */}
        {state === 'expired' && (
          <motion.div
            key="expired"
            {...FADE_IN}
            exit={{ opacity: 0 }}
            className="flex h-[320px] w-[300px] flex-col items-center justify-center gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
              <svg
                className="h-8 w-8 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-foreground-muted">
              {t('login.qr_expired', 'QR code expired')}
            </p>
            <button
              onClick={createSession}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              {t('login.qr_generate_new', 'Generate New Code')}
            </button>
          </motion.div>
        )}

        {/* Error */}
        {state === 'error' && (
          <motion.div
            key="error"
            {...FADE_IN}
            exit={{ opacity: 0 }}
            className="flex h-[320px] w-[300px] flex-col items-center justify-center gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-sm text-foreground-muted">{error}</p>
            <button
              onClick={createSession}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              {t('login.qr_try_again', 'Try Again')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QrLogin;
