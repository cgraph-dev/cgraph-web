/**
 * IncomingCallHandler Component
 *
 * Global handler for incoming WebRTC calls.
 * Displays the IncomingCallModal when a call comes in and handles accept/decline actions.
 *
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { IncomingCallModal } from './incoming-call-modal';
import { useIncomingCallStore, type IncomingCall } from '@/modules/calls/store';

const isE2EAuthBypass = import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIncomingCall(value: unknown): value is IncomingCall {
  if (!isRecord(value)) return false;

  return (
    typeof value.roomId === 'string' &&
    typeof value.callerId === 'string' &&
    typeof value.callerName === 'string' &&
    (value.callerAvatar === null || typeof value.callerAvatar === 'string') &&
    (value.type === 'audio' || value.type === 'video') &&
    typeof value.timestamp === 'number'
  );
}

/**
 * IncomingCallHandler Component
 *
 * This component should be mounted at the app root level.
 * It listens for incoming calls from the store and displays the modal.
 */
export function IncomingCallHandler() {
  const navigate = useNavigate();
  const { incomingCall, declineCall, setIncomingCall } = useIncomingCallStore();
  const [showModal, setShowModal] = useState(false);

  // Show modal when incoming call arrives
  useEffect(() => {
    if (incomingCall) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [incomingCall]);

  const handleAccept = useCallback(
    async (roomId: string, isVideo: boolean) => {
      if (!incomingCall) return;

      const callType = isVideo ? 'video' : 'audio';
      const query = new URLSearchParams({ incoming: 'true', roomId });
      navigate(`/call/${incomingCall.callerId}/${callType}?${query.toString()}`);

      // Clear the incoming call from store
      declineCall();
    },
    [declineCall, incomingCall, navigate]
  );

  const handleDecline = useCallback(() => {
    declineCall();
  }, [declineCall]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!incomingCall) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        handleAccept(incomingCall.roomId, incomingCall.type === 'video');
      } else if (e.key === 'd' || e.key === 'D') {
        handleDecline();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [incomingCall, handleAccept, handleDecline]);

  useEffect(() => {
    if (!isE2EAuthBypass) return;

    const handleE2EIncomingCall = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;

      if (isIncomingCall(event.detail)) {
        setIncomingCall(event.detail);
      }
    };

    window.addEventListener('cgraph:e2e-incoming-call', handleE2EIncomingCall);
    return () => window.removeEventListener('cgraph:e2e-incoming-call', handleE2EIncomingCall);
  }, [setIncomingCall]);

  return (
    <AnimatePresence>
      {showModal && incomingCall && (
        <IncomingCallModal call={incomingCall} onAccept={handleAccept} onDecline={handleDecline} />
      )}
    </AnimatePresence>
  );
}

export default IncomingCallHandler;
